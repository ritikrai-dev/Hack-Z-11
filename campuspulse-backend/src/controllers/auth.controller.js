import { login, changeUserPassword } from "../services/auth.service.js";
import { success, failure } from "../utils/response.js";
import { mockDatabase } from "../services/mockData.js";

export async function loginController(req, res, next) {
  try {
    const id = req.body.userId || req.body.collegeId || req.body.studentId || req.body.adminId;
    const { password, expectedPortal } = req.body;
    const expectedRole = req.body.expectedRole || req.body.role;

    if (!id || !password) {
      return failure(res, "User ID / College ID and password are required", 400);
    }

    const data = await login(id.trim(), password);

    // Enforce role-gated login boundaries
    if (expectedRole === "STUDENT" && data.user.role !== "STUDENT") {
      return failure(res, "Invalid role. Please use the Teacher Login portal.", 403);
    }

    if (expectedRole === "TEACHER" && data.user.role !== "TEACHER") {
      return failure(res, "Invalid role. Please use the Student Login portal.", 403);
    }

    if (expectedRole === "CLUB_LEADER" && data.user.role !== "CLUB_LEADER") {
      return failure(res, "Invalid role. Please select your registered role.", 403);
    }

    // Enforce portal isolation:
    // 1. If trying to log into Student/Staff portal with an ADMIN account:
    if (expectedPortal === "student-staff" && data.user.role === "ADMIN") {
      return failure(res, "ADMIN accounts cannot access Student & Staff portal. Please use the Admin Portal.", 403);
    }

    // 2. If trying to log into Admin Portal with a non-ADMIN account:
    if (expectedPortal === "admin" && data.user.role !== "ADMIN") {
      return failure(res, "Access denied. Only authorized ADMIN accounts may access the Admin Portal.", 403);
    }

    return res.status(200).json({
      success: true,
      message: `Login successful as ${data.user.role}`,
      token: data.token,
      accessToken: data.accessToken,
      user: data.user,
      data: data
    });
  } catch (error) {
    next(error);
  }
}

export function logoutController(req, res) {
  return success(res, "Logout successful", {});
}

export async function changePasswordController(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const identifier = req.user?.sub || req.user?.studentId || req.body.userId || req.body.studentId;

    if (!identifier) {
      return failure(res, "User identifier is required to change password", 400);
    }

    if (!newPassword || newPassword.length < 6) {
      return failure(res, "New password must be at least 6 characters long", 400);
    }

    const result = await changeUserPassword(identifier, currentPassword, newPassword);

    return success(res, "Password updated successfully. You may now access your portal.", result);
  } catch (error) {
    next(error);
  }
}

export function meController(req, res) {
  const identifier = req.user?.sub || req.user?.studentId;
  const user = mockDatabase.users.find(u => u.id === identifier || u.studentId === identifier);

  if (!user) {
    return failure(res, "User not found", 404);
  }

  const sanitized = {
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
    mustChangePassword: Boolean(user.mustChangePassword)
  };

  return success(res, "Current user profile retrieved", sanitized);
}

