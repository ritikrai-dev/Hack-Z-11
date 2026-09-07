// CampusPulse Official Exam Timetable Service
// Verified source of truth for all college examination schedules

class ExamService {
  constructor() {
    this.exams = [
      {
        id: "exam_bmms_01",
        subject: "BMMS (Business Management & Marketing Strategies)",
        subjectCode: "BMMS301",
        course: "TYBSc CS",
        department: "Computer Science & Engineering",
        semester: "Semester 5",
        division: "Division A",
        date: "18 September 2026",
        isoDate: "2026-09-18T10:00:00Z",
        time: "10:00 AM - 1:00 PM",
        room: "Room 204 (Wing B)",
        reportingTime: "9:30 AM",
        type: "Theory (End-Semester)",
        totalMarks: 75,
        hallTicketRequired: true,
        instructor: "Prof. Arvind Rao"
      },
      {
        id: "exam_cn_02",
        subject: "Computer Networks & Protocols",
        subjectCode: "CS501",
        course: "TYBSc CS",
        department: "Computer Science & Engineering",
        semester: "Semester 5",
        division: "Division A",
        date: "21 September 2026",
        isoDate: "2026-09-21T10:00:00Z",
        time: "10:00 AM - 1:00 PM",
        room: "Room 302 (Main Block)",
        reportingTime: "9:30 AM",
        type: "Theory (End-Semester)",
        totalMarks: 75,
        hallTicketRequired: true,
        instructor: "Prof. Arvind Rao"
      },
      {
        id: "exam_dbms_03",
        subject: "Database Management Systems & SQL",
        subjectCode: "CS502",
        course: "TYBSc CS",
        department: "Computer Science & Engineering",
        semester: "Semester 5",
        division: "Division A",
        date: "24 September 2026",
        isoDate: "2026-09-24T14:00:00Z",
        time: "2:00 PM - 5:00 PM",
        room: "Turing Lab 101",
        reportingTime: "1:30 PM",
        type: "Theory + Practical (End-Semester)",
        totalMarks: 100,
        hallTicketRequired: true,
        instructor: "Prof. Sunita Deshmukh"
      },
      {
        id: "exam_os_04",
        subject: "Operating Systems & Kernel Architecture",
        subjectCode: "CS503",
        course: "TYBSc CS",
        department: "Computer Science & Engineering",
        semester: "Semester 5",
        division: "Division A",
        date: "28 September 2026",
        isoDate: "2026-09-28T10:00:00Z",
        time: "10:00 AM - 1:00 PM",
        room: "Room 204 (Wing B)",
        reportingTime: "9:30 AM",
        type: "Theory (End-Semester)",
        totalMarks: 75,
        hallTicketRequired: true,
        instructor: "Dr. K. N. Verma"
      },
      {
        id: "exam_se_05",
        subject: "Software Engineering & Agile Methodologies",
        subjectCode: "CS504",
        course: "TYBSc CS",
        department: "Computer Science & Engineering",
        semester: "Semester 5",
        division: "Division A",
        date: "02 October 2026",
        isoDate: "2026-10-02T10:00:00Z",
        time: "10:00 AM - 1:00 PM",
        room: "Room 105 (East Wing)",
        reportingTime: "9:30 AM",
        type: "Theory (End-Semester)",
        totalMarks: 75,
        hallTicketRequired: true,
        instructor: "Prof. Arvind Rao"
      }
    ];
  }

  // Get all exams for a student's enrolled course and semester
  getExamsForStudent(student = {}) {
    const course = (student.course || student.year || "TYBSc CS").toLowerCase();
    const sem = (student.semester || "Semester 5").toLowerCase();

    // Default to TYBSc CS exams if matching
    return this.exams.filter(e => {
      return (
        e.course.toLowerCase().includes("tybsc") ||
        e.department.toLowerCase() === (student.department || "").toLowerCase()
      );
    });
  }

  // Find exam by keyword (e.g. "BMMS", "networks", "dbms")
  searchExams(query) {
    if (!query) return this.exams;
    const q = query.toLowerCase().trim();

    return this.exams.filter(e => {
      return (
        e.subject.toLowerCase().includes(q) ||
        e.subjectCode.toLowerCase().includes(q) ||
        e.room.toLowerCase().includes(q)
      );
    });
  }

  // Get specific exam by subject key
  findExamBySubject(subjectQuery) {
    const q = subjectQuery.toLowerCase();
    return this.exams.find(e =>
      e.subject.toLowerCase().includes(q) ||
      e.subjectCode.toLowerCase().includes(q)
    );
  }
}

export const examService = new ExamService();
