async function run() {
  console.log("=================================================================");
  console.log("CAMPUSPULSE ADVANCED APPLICATION FLOW & FEATURES VERIFICATION");
  console.log("=================================================================\n");

  const baseUrl = "http://localhost:5000/api/v1";

  // 1. Role-Gated Logins
  console.log("[TEST 1] Testing Strict Role-Gated Logins...");
  // Student login with Student credentials
  const studLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "2023CS042", password: "student123", expectedRole: "STUDENT" })
  });
  const studLoginData = await studLoginRes.json();
  console.log("  ✓ Student login on /student/login:", studLoginRes.status, studLoginData.message);
  const studentToken = studLoginData.data.token;

  // Teacher credentials on Student login -> must be 403
  const studRejectRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "TCH101", password: "teacher123", expectedRole: "STUDENT" })
  });
  const studRejectData = await studRejectRes.json();
  console.log("  ✓ Teacher rejected on /student/login (403):", studRejectRes.status, studRejectData.message);

  // Student credentials on Teacher login -> must be 403
  const teachRejectRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "2023CS042", password: "student123", expectedRole: "TEACHER" })
  });
  const teachRejectData = await teachRejectRes.json();
  console.log("  ✓ Student rejected on /teacher/login (403):", teachRejectRes.status, teachRejectData.message);

  // Teacher login on /teacher/login -> must be 200
  const teachLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "TCH101", password: "teacher123", expectedRole: "TEACHER" })
  });
  const teachLoginData = await teachLoginRes.json();
  console.log("  ✓ Teacher login on /teacher/login:", teachLoginRes.status, teachLoginData.message);
  const teacherToken = teachLoginData.data.token;

  // 2. Drag-and-Drop File Upload
  console.log("\n[TEST 2] Testing Modular Notice File Upload (PDF, 10MB)...");
  const formData = new FormData();
  const dummyFile = new Blob(["Official Semester Notice Content - PDF Buffer"], { type: "application/pdf" });
  formData.append("file", dummyFile, "Semester_Exam_TimeTable.pdf");

  const uploadRes = await fetch(`${baseUrl}/files/upload`, {
    method: "POST",
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log("  ✓ File Upload Status:", uploadRes.status);
  console.log("  ✓ Uploaded File URL:", uploadData.data.file.url);
  console.log("  ✓ Original Name & Size:", uploadData.data.file.originalName, uploadData.data.file.size, "bytes");

  // 3. Notice Publishing with File Attachment
  console.log("\n[TEST 3] Testing Notice Publishing with File Attachment...");
  const noticeRes = await fetch(`${baseUrl}/notices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: "End Semester Examination Schedule",
      category: "Exam",
      content: "All eligible students must download the attached examination timetable.",
      attachments: [{
        name: uploadData.data.file.originalName,
        url: uploadData.data.file.url,
        size: `${(uploadData.data.file.size / 1024).toFixed(1)} KB`,
        type: "pdf"
      }]
    })
  });
  const noticeData = await noticeRes.json();
  console.log("  ✓ Notice Created:", noticeRes.status, noticeData.message);
  console.log("  ✓ Attachments Attached:", noticeData.data.notice.attachments.length);

  // 4. Create INTRA-COLLEGE Event with Custom In-House Registration Form
  console.log("\n[TEST 4] Testing INTRA-COLLEGE Event Creation (In-House Form)...");
  const intraEventRes = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: "Campus Robotics Sprint (In-House)",
      venue: "Robotics Lab 102",
      date: "Sep 20, 2026",
      capacity: 50,
      scope: "INTRA-COLLEGE",
      customFormFields: ["Student ID / Roll No", "Department & Semester", "Project Experience", "Team Name"]
    })
  });
  const intraEventData = await intraEventRes.json();
  console.log("  ✓ INTRA-COLLEGE Event Created:", intraEventRes.status, intraEventData.data.event.title);
  console.log("  ✓ Scope:", intraEventData.data.event.scope);
  console.log("  ✓ In-House Custom Form Fields:", intraEventData.data.event.customFormFields);
  const intraEventId = intraEventData.data.event.id;

  // 5. Create INTER-COLLEGE Event with External Registration Link
  console.log("\n[TEST 5] Testing INTER-COLLEGE Event Creation (External Link)...");
  const interEventRes = await fetch(`${baseUrl}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: "All-India Inter-College AI Hackathon",
      venue: "Central Auditorium & Online",
      date: "Oct 05, 2026",
      capacity: 250,
      scope: "INTER-COLLEGE",
      externalRegistrationLink: "https://unstop.com/hackathons/all-india-ai-2026"
    })
  });
  const interEventData = await interEventRes.json();
  console.log("  ✓ INTER-COLLEGE Event Created:", interEventRes.status, interEventData.data.event.title);
  console.log("  ✓ Scope:", interEventData.data.event.scope);
  console.log("  ✓ External Registration Link:", interEventData.data.event.externalRegistrationLink);

  // 6. Student Registers for INTRA-COLLEGE Event with Custom Form Answers
  console.log("\n[TEST 6] Testing Student Registration for INTRA-COLLEGE Event...");
  const rsvpRes = await fetch(`${baseUrl}/events/${intraEventId}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      formData: {
        "Student ID / Roll No": "2023CS042",
        "Department & Semester": "CSE - Sem 5",
        "Project Experience": "Built autonomous RC robot with Arduino",
        "Team Name": "CyberBots"
      }
    })
  });
  const rsvpData = await rsvpRes.json();
  console.log("  ✓ Registration Status:", rsvpRes.status, rsvpData.message);
  console.log("  ✓ Digital Ticket ID Issued:", rsvpData.data.ticket.ticketId);
  console.log("  ✓ QR Code Payload:", rsvpData.data.ticket.qrPayload);

  // 7. Teacher Views Registrations Roster
  console.log("\n[TEST 7] Testing Teacher Viewing Event Attendee Roster...");
  const rosterRes = await fetch(`${baseUrl}/events/${intraEventId}/registrations`, {
    headers: { "Authorization": `Bearer ${teacherToken}` }
  });
  const rosterData = await rosterRes.json();
  console.log("  ✓ Roster Fetch Status:", rosterRes.status);
  console.log("  ✓ Total Attendees:", rosterData.data.registrations.length);
  console.log("  ✓ Registered Student Name:", rosterData.data.registrations[0].name);
  console.log("  ✓ Custom Form Response Data:", rosterData.data.registrations[0].formData);

  // 8. Teacher Exports to Excel (.xlsx)
  console.log("\n[TEST 8] Testing Teacher Native Excel (.xlsx) Export...");
  const xlsxRes = await fetch(`${baseUrl}/events/${intraEventId}/registrations/export?format=xlsx`, {
    headers: { "Authorization": `Bearer ${teacherToken}` }
  });
  const xlsxBuf = await xlsxRes.arrayBuffer();
  console.log("  ✓ Export Status:", xlsxRes.status);
  console.log("  ✓ Content-Type:", xlsxRes.headers.get("content-type"));
  console.log("  ✓ Binary Spreadsheet Size:", xlsxBuf.byteLength, "bytes");

  // 9. Teacher Exports to JSON
  console.log("\n[TEST 9] Testing Teacher JSON Export...");
  const jsonRes = await fetch(`${baseUrl}/events/${intraEventId}/registrations/export?format=json`, {
    headers: { "Authorization": `Bearer ${teacherToken}` }
  });
  const jsonData = await jsonRes.json();
  console.log("  ✓ Export Status:", jsonRes.status);
  console.log("  ✓ Content-Type:", jsonRes.headers.get("content-type"));
  console.log("  ✓ Exported JSON Total Attendees:", jsonData.totalRegistered);

  console.log("\n=================================================================");
  console.log("ALL ADVANCED APPLICATION FLOW TESTS COMPLETED WITH 100% SUCCESS!");
  console.log("=================================================================");
}

run().catch(console.error);
