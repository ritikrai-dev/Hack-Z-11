import { supabase } from "../config/supabase.js";
import { comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { mockDatabase } from "./mockData.js";

export async function login(userId, password) {
  let user = null;

  // 1. Try Supabase if tables exist
  try {
    const { data: dbUsers, error } = await supabase
      .from("users")
      .select("*")
      .or(`student_id.eq.${userId},email.eq.${userId}`)
      .limit(1);

    if (!error && dbUsers && dbUsers.length > 0) {
      const dbUser = dbUsers[0];
      const valid = (password === dbUser.password_hash) || (await comparePassword(password, dbUser.password_hash).catch(() => false));
      if (valid) {
        user = {
          id: dbUser.id,
          studentId: dbUser.student_id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          department: dbUser.department_id,
          year: dbUser.academic_year,
          division: dbUser.division,
          phone: dbUser.phone,
          assignedClub: dbUser.assigned_club_id,
          isActive: Boolean(dbUser.is_active),
          mustChangePassword: Boolean(dbUser.must_change_password)
        };
      }
    }
  } catch {
    // Supabase table not yet provisioned, fall through to in-memory store
  }

  // 2. Fallback to mockDatabase users
  if (!user) {
    const match = mockDatabase.users.find(
      (u) => u.studentId.toLowerCase() === userId.toLowerCase() || u.email.toLowerCase() === userId.toLowerCase()
    );

    if (match) {
      if (match.password === password) {
        user = {
          id: match.id,
          studentId: match.studentId,
          name: match.name,
          email: match.email,
          role: match.role,
          department: match.department,
          year: match.year,
          division: match.division,
          phone: match.phone,
          assignedClub: match.assignedClub,
          isActive: match.isActive !== false,
          mustChangePassword: Boolean(match.mustChangePassword)
        };
      }
    }
  }

  if (!user) {
    throw Object.assign(new Error("Invalid credentials. Please check your User ID and password."), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error("Account is currently deactivated. Please contact campus administration."), { statusCode: 403 });
  }

  const token = signAccessToken({
    sub: user.id,
    studentId: user.studentId,
    role: user.role,
    name: user.name,
    department: user.department,
    mustChangePassword: user.mustChangePassword
  });

  return {
    user,
    token,
    accessToken: token,
    mustChangePassword: user.mustChangePassword
  };
}

export async function changeUserPassword(identifier, currentPassword, newPassword) {
  // Update in Supabase if present
  try {
    await supabase
      .from("users")
      .update({
        password_hash: newPassword,
        must_change_password: false,
        updated_at: new Date().toISOString()
      })
      .or(`id.eq.${identifier},student_id.eq.${identifier}`);
  } catch {
    // Supabase table not yet provisioned
  }

  const user = mockDatabase.users.find(
    (u) => u.id === identifier || u.studentId?.toLowerCase() === identifier?.toLowerCase() || u.email?.toLowerCase() === identifier?.toLowerCase()
  );

  if (!user) {
    throw Object.assign(new Error("User account not found"), { statusCode: 404 });
  }

  if (currentPassword && user.password !== currentPassword) {
    throw Object.assign(new Error("Current password is incorrect"), { statusCode: 400 });
  }

  if (newPassword.length < 6) {
    throw Object.assign(new Error("New password must be at least 6 characters long"), { statusCode: 400 });
  }

  if (currentPassword && newPassword === currentPassword) {
    throw Object.assign(new Error("New password cannot be the same as current password"), { statusCode: 400 });
  }

  user.password = newPassword;
  user.mustChangePassword = false;

  const token = signAccessToken({
    sub: user.id,
    studentId: user.studentId,
    role: user.role,
    name: user.name,
    department: user.department,
    mustChangePassword: false
  });

  const sanitizedUser = {
    id: user.id,
    studentId: user.studentId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    year: user.year,
    division: user.division,
    phone: user.phone,
    assignedClub: user.assignedClub,
    isActive: user.isActive !== false,
    mustChangePassword: false
  };

  return {
    user: sanitizedUser,
    token,
    accessToken: token,
    mustChangePassword: false
  };
}
