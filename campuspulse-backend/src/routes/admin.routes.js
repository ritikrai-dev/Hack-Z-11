import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { mockDatabase } from "../services/mockData.js";
import { supabase } from "../config/supabase.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

// 1. Admin Dashboard Stats
router.get("/stats", async (req, res) => {
  let studentCount = mockDatabase.users.filter(u => u.role === "STUDENT").length;
  let teacherCount = mockDatabase.users.filter(u => u.role === "TEACHER").length;
  let clubLeaderCount = mockDatabase.users.filter(u => u.role === "CLUB_LEADER").length;
  let eventCount = mockDatabase.events.length;
  let clubCount = mockDatabase.clubs.length;

  try {
    const [sc, tc, lc, ec, cc] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "TEACHER"),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "CLUB_LEADER"),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("clubs").select("*", { count: "exact", head: true })
    ]);

    if (sc.count !== null) studentCount = sc.count;
    if (tc.count !== null) teacherCount = tc.count;
    if (lc.count !== null) clubLeaderCount = lc.count;
    if (ec.count !== null) eventCount = ec.count;
    if (cc.count !== null) clubCount = cc.count;
  } catch {
    // Use fallback counts
  }

  return success(res, "Admin stats fetched successfully", {
    totalStudents: studentCount,
    totalTeachers: teacherCount,
    totalClubLeaders: clubLeaderCount,
    totalEvents: eventCount,
    totalNotices: mockDatabase.notices.length,
    activeClubs: clubCount,
    recentActivity: [
      { id: "act_1", action: "Notice Published", detail: "Mid-sem Exam Reschedule datesheet", time: "2h ago", actor: "CS Dept" },
      { id: "act_2", action: "User Created", detail: "Student 2024CS099 (Aarav Patel)", time: "3h ago", actor: "Admin" },
      { id: "act_3", action: "Event Boosted", detail: "Edge AI & Robotics Workshop", time: "5h ago", actor: "Organizer" },
      { id: "act_4", action: "Club Assigned", detail: "Karan Johal assigned to Coding Club", time: "1d ago", actor: "Admin" }
    ]
  });
});

// 2. Student Management
router.get("/students", async (req, res) => {
  const { search, department, year, division } = req.query;

  try {
    const { data: supaStudents, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "STUDENT");

    if (!error && supaStudents && supaStudents.length > 0) {
      let mapped = supaStudents.map(s => ({
        id: s.id,
        studentId: s.student_id,
        name: s.name,
        email: s.email,
        role: s.role,
        department: s.department_id,
        year: s.academic_year,
        division: s.division,
        phone: s.phone,
        isActive: s.is_active,
        mustChangePassword: s.must_change_password
      }));

      if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter(u => u.name.toLowerCase().includes(q) || u.studentId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return success(res, "Students fetched successfully", { students: mapped });
    }
  } catch {
    // Fallback to in-memory store
  }

  let list = mockDatabase.users.filter(u => u.role === "STUDENT");
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.studentId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (department && department !== "All") {
    list = list.filter(u => u.department.toLowerCase() === department.toLowerCase());
  }
  if (year && year !== "All") {
    list = list.filter(u => u.year === year);
  }
  if (division && division !== "All") {
    list = list.filter(u => u.division === division);
  }

  const sanitized = list.map(({ password, ...rest }) => rest);
  return success(res, "Students fetched successfully", { students: sanitized });
});

router.post("/students", async (req, res) => {
  const { studentId, name, email, department, year, division, phone, temporaryPassword } = req.body;
  if (!studentId || !name || !email) {
    return failure(res, "studentId, name and email are required", 400);
  }

  const tempPass = temporaryPassword || `Temp${Math.floor(1000 + Math.random() * 9000)}!`;
  const newStudent = {
    id: `usr_std_${Date.now()}`,
    studentId: studentId.trim(),
    name: name.trim(),
    email: email.trim(),
    role: "STUDENT",
    department: department || "Computer Science & Engineering",
    year: year || "1st Year",
    division: division || "A",
    phone: phone || "",
    password: tempPass,
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString()
  };

  // Sync to Supabase
  try {
    await supabase.from("users").insert({
      id: newStudent.id,
      student_id: newStudent.studentId,
      name: newStudent.name,
      email: newStudent.email,
      password_hash: tempPass,
      role: "STUDENT",
      department_id: "dept_cs",
      academic_year: year || "1st",
      division: division || "A",
      phone: phone || "",
      must_change_password: true,
      is_active: true
    });
  } catch (err) {
    console.warn("Supabase student sync warning:", err.message);
  }

  mockDatabase.users.unshift(newStudent);
  const { password, ...safeStudent } = newStudent;
  return success(res, "Student credential provisioned successfully", { student: safeStudent, temporaryPassword: tempPass }, 201);
});

router.patch("/students/:id/status", async (req, res) => {
  const { id } = req.params;
  const user = mockDatabase.users.find(u => (u.id === id || u.studentId === id) && u.role === "STUDENT");
  if (!user) return failure(res, "Student not found", 404);

  user.isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !user.isActive;

  try {
    await supabase.from("users").update({ is_active: user.isActive }).or(`id.eq.${id},student_id.eq.${id}`);
  } catch {
    // Fallback
  }

  return success(res, `Student account ${user.isActive ? "activated" : "deactivated"} successfully`, {
    studentId: user.studentId,
    isActive: user.isActive
  });
});

router.post("/students/:id/reset-password", async (req, res) => {
  const { id } = req.params;
  const user = mockDatabase.users.find(u => (u.id === id || u.studentId === id) && u.role === "STUDENT");
  if (!user) return failure(res, "Student not found", 404);

  const newTempPass = req.body.temporaryPassword || `Reset${Math.floor(1000 + Math.random() * 9000)}!`;
  user.password = newTempPass;
  user.mustChangePassword = true;

  try {
    await supabase.from("users").update({
      password_hash: newTempPass,
      must_change_password: true
    }).or(`id.eq.${id},student_id.eq.${id}`);
  } catch {
    // Fallback
  }

  return success(res, "Password reset successfully. Temporary credential generated.", {
    studentId: user.studentId,
    temporaryPassword: newTempPass
  });
});

// 3. Teacher Management
router.get("/teachers", async (req, res) => {
  const { search } = req.query;

  try {
    const { data: supaTeachers, error } = await supabase.from("users").select("*").eq("role", "TEACHER");
    if (!error && supaTeachers && supaTeachers.length > 0) {
      let mapped = supaTeachers.map(t => ({
        id: t.id,
        teacherId: t.student_id,
        name: t.name,
        email: t.email,
        department: t.department_id,
        phone: t.phone,
        isActive: t.is_active
      }));
      if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter(u => u.name.toLowerCase().includes(q) || u.teacherId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return success(res, "Teachers fetched successfully", { teachers: mapped });
    }
  } catch {
    // Fallback
  }

  let list = mockDatabase.users.filter(u => u.role === "TEACHER");
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.studentId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const sanitized = list.map(({ password, ...rest }) => rest);
  return success(res, "Teachers fetched successfully", { teachers: sanitized });
});

router.post("/teachers", async (req, res) => {
  const { teacherId, name, email, department, phone, temporaryPassword } = req.body;
  if (!teacherId || !name || !email) {
    return failure(res, "teacherId, name and email are required", 400);
  }

  const tempPass = temporaryPassword || "teacher123";
  const newTeacher = {
    id: `usr_tch_${Date.now()}`,
    studentId: teacherId.trim(),
    name: name.trim(),
    email: email.trim(),
    role: "TEACHER",
    department: department || "Computer Science",
    phone: phone || "",
    password: tempPass,
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from("users").insert({
      id: newTeacher.id,
      student_id: newTeacher.studentId,
      name: newTeacher.name,
      email: newTeacher.email,
      password_hash: tempPass,
      role: "TEACHER",
      department_id: "dept_cs",
      phone: phone || "",
      is_active: true
    });
  } catch (err) {
    console.warn("Supabase teacher sync warning:", err.message);
  }

  mockDatabase.users.unshift(newTeacher);
  const { password, ...safeTeacher } = newTeacher;
  return success(res, "Teacher account registered successfully", { teacher: safeTeacher }, 201);
});

router.patch("/teachers/:id/status", async (req, res) => {
  const { id } = req.params;
  const user = mockDatabase.users.find(u => (u.id === id || u.studentId === id) && u.role === "TEACHER");
  if (!user) return failure(res, "Teacher not found", 404);

  user.isActive = !user.isActive;

  try {
    await supabase.from("users").update({ is_active: user.isActive }).or(`id.eq.${id},student_id.eq.${id}`);
  } catch {
    // Fallback
  }

  return success(res, `Teacher status updated to ${user.isActive ? "ACTIVE" : "INACTIVE"}`, {
    teacherId: user.studentId,
    isActive: user.isActive
  });
});

// 4. Club Leader Management
router.get("/club-leaders", async (req, res) => {
  const { search } = req.query;

  try {
    const { data: supaLeaders, error } = await supabase.from("users").select("*").eq("role", "CLUB_LEADER");
    if (!error && supaLeaders && supaLeaders.length > 0) {
      let mapped = supaLeaders.map(c => ({
        id: c.id,
        clubLeaderId: c.student_id,
        name: c.name,
        email: c.email,
        assignedClub: c.assigned_club_id === "club_coding" ? "Coding Club" : (c.assigned_club_id === "club_robotics" ? "Robotics Guild" : "Design Collective"),
        phone: c.phone,
        isActive: c.is_active
      }));
      if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter(u => u.name.toLowerCase().includes(q) || u.clubLeaderId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return success(res, "Club leaders fetched successfully", { clubLeaders: mapped });
    }
  } catch {
    // Fallback
  }

  let list = mockDatabase.users.filter(u => u.role === "CLUB_LEADER");
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.studentId.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  const sanitized = list.map(({ password, ...rest }) => rest);
  return success(res, "Club leaders fetched successfully", { clubLeaders: sanitized });
});

router.post("/club-leaders", async (req, res) => {
  const { clubLeaderId, name, email, assignedClub, phone, temporaryPassword } = req.body;
  if (!clubLeaderId || !name || !email) {
    return failure(res, "clubLeaderId, name and email are required", 400);
  }

  const tempPass = temporaryPassword || "club123";
  const newLeader = {
    id: `usr_clb_${Date.now()}`,
    studentId: clubLeaderId.trim(),
    name: name.trim(),
    email: email.trim(),
    role: "CLUB_LEADER",
    department: "Computer Science",
    assignedClub: assignedClub || "Coding Club",
    phone: phone || "",
    password: tempPass,
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date().toISOString()
  };

  try {
    await supabase.from("users").insert({
      id: newLeader.id,
      student_id: newLeader.studentId,
      name: newLeader.name,
      email: newLeader.email,
      password_hash: tempPass,
      role: "CLUB_LEADER",
      assigned_club_id: assignedClub === "Robotics Guild" ? "club_robotics" : "club_coding",
      phone: phone || "",
      is_active: true
    });
  } catch (err) {
    console.warn("Supabase club leader sync warning:", err.message);
  }

  mockDatabase.users.unshift(newLeader);
  const { password, ...safeLeader } = newLeader;
  return success(res, "Club leader appointed successfully", { clubLeader: safeLeader }, 201);
});

router.patch("/club-leaders/:id/status", async (req, res) => {
  const { id } = req.params;
  const user = mockDatabase.users.find(u => (u.id === id || u.studentId === id) && u.role === "CLUB_LEADER");
  if (!user) return failure(res, "Club leader not found", 404);

  user.isActive = !user.isActive;

  try {
    await supabase.from("users").update({ is_active: user.isActive }).or(`id.eq.${id},student_id.eq.${id}`);
  } catch {
    // Fallback
  }

  return success(res, `Club leader status updated to ${user.isActive ? "ACTIVE" : "INACTIVE"}`, {
    clubLeaderId: user.studentId,
    isActive: user.isActive
  });
});

export default router;
