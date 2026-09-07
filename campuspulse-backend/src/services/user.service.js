import { supabase } from "../config/supabase.js";
import { mockDatabase } from "./mockData.js";

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, student_id, name, email, role, department_id, academic_year, division, phone, assigned_club_id, is_active, must_change_password")
      .or(`id.eq.${userId},student_id.eq.${userId}`)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        studentId: data.student_id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department_id,
        year: data.academic_year,
        division: data.division,
        phone: data.phone,
        assignedClub: data.assigned_club_id,
        isActive: Boolean(data.is_active),
        mustChangePassword: Boolean(data.must_change_password)
      };
    }
  } catch {
    // Fall back to in-memory store
  }

  const found = mockDatabase.users.find(u => u.id === userId || u.studentId === userId);
  if (found) {
    return {
      id: found.id,
      studentId: found.studentId,
      name: found.name,
      email: found.email,
      role: found.role,
      department: found.department,
      year: found.year,
      division: found.division,
      phone: found.phone,
      assignedClub: found.assignedClub,
      isActive: found.isActive !== false,
      mustChangePassword: Boolean(found.mustChangePassword)
    };
  }

  return mockDatabase.currentUser;
}
