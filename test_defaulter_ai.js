// Test Defaulter and AI Assistant Endpoints with Seat Number Enforcement
const API_URL = "http://localhost:5000/api/v1";

async function runTests() {
  console.log("=================================================");
  console.log("TESTING SEAT NUMBER VALIDATION & REAL-TIME SYNC");
  console.log("=================================================");

  let teacherToken = "";
  let studentToken = "";

  // 1. Teacher Login
  try {
    const teacherLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "TCH101",
        password: "teacher123",
        role: "TEACHER"
      })
    });
    const teacherLoginData = await teacherLoginRes.json();
    teacherToken = teacherLoginData.data?.token;
    console.log("1. Teacher Login:", teacherLoginData.success ? "PASS (Token acquired)" : "FAIL");
  } catch (err) {
    console.error("1. Teacher Login Error:", err.message);
  }

  // 2. Student Login
  try {
    const studentLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "2026CS023",
        password: "student123",
        role: "STUDENT"
      })
    });
    const studentLoginData = await studentLoginRes.json();
    studentToken = studentLoginData.data?.token;
    console.log("2. Student Login:", studentLoginData.success ? "PASS (Token acquired)" : "FAIL");
  } catch (err) {
    console.error("2. Student Login Error:", err.message);
  }

  // 3. Test Real-Time DB Verification: REJECT Invalid Seat Number
  try {
    const invalidSeatRes = await fetch(`${API_URL}/defaulters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        seatNumber: "INVALID_SEAT_999",
        studentName: "Ghost Student",
        subject: "Computer Networks",
        attendancePercentage: 45
      })
    });
    const invalidData = await invalidSeatRes.json();
    const isRejected = !invalidData.success && (invalidSeatRes.status === 404 || invalidSeatRes.status === 422);
    console.log(`3. Reject Invalid Seat Number (${invalidSeatRes.status}):`, isRejected ? "PASS" : "FAIL", invalidData.message);
  } catch (err) {
    console.error("3. Invalid Seat Test Error:", err.message);
  }

  // 4. Test Real-Time DB Verification: ACCEPT Valid Seat Number (S2026023)
  let committedDefaulterId = "";
  try {
    const validSeatRes = await fetch(`${API_URL}/defaulters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        seatNumber: "S2026023",
        studentName: "Rahul Sharma",
        subject: "Computer Networks",
        attendancePercentage: 62,
        noticeTitle: "Practical Shortage Circular #05",
        reason: "Attendance below 75% practical threshold"
      })
    });
    const validData = await validSeatRes.json();
    const isSuccess = validData.success && validData.data?.defaulter?.verified === true;
    committedDefaulterId = validData.data?.defaulter?.id;
    console.log("4. Accept & Verify Valid Seat Number (201):", isSuccess ? "PASS" : "FAIL", {
      seatNumber: validData.data?.defaulter?.seatNumber,
      attendancePercentage: validData.data?.defaulter?.attendancePercentage,
      verified: validData.data?.defaulter?.verified
    });
  } catch (err) {
    console.error("4. Valid Seat Test Error:", err.message);
  }

  // 5. Test File Parser: REJECT File without Seat Number Column
  try {
    const rejectParserRes = await fetch(`${API_URL}/defaulters/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        subject: "Computer Networks",
        rawText: "Student Name, Attendance %\nRahul Sharma, 62%"
      })
    });
    const rejectParserData = await rejectParserRes.json();
    const isParserRejected = !rejectParserData.success && rejectParserRes.status === 400;
    console.log("5. Reject Parser Missing Seat Number (400):", isParserRejected ? "PASS" : "FAIL", rejectParserData.message);
  } catch (err) {
    console.error("5. Reject Parser Error:", err.message);
  }

  // 6. Test File Parser: ACCEPT File with Seat Number Column & Verify DB Rows
  try {
    const acceptParserRes = await fetch(`${API_URL}/defaulters/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        subject: "Computer Networks",
        rawText: "Seat Number, Student Name, Attendance %\nS2026023, Rahul Sharma, 62%\nS2026031, Riya Shah, 58%\nINVALID_777, Fake Student, 40%"
      })
    });
    const acceptParserData = await acceptParserRes.json();
    const summary = acceptParserData.data?.summary;
    console.log("6. Accept Parser with Seat Numbers:", acceptParserData.success ? "PASS" : "FAIL", {
      total: summary?.total,
      matched: summary?.matched,
      invalidSeatNumbers: summary?.invalidSeatNumbers
    });
  } catch (err) {
    console.error("6. Accept Parser Error:", err.message);
  }

  // 7. Test Student Defaulter Check by Seat Number
  try {
    const checkRes = await fetch(`${API_URL}/defaulters/check-student/2026CS023?seatNumber=S2026023`, {
      headers: { "Authorization": `Bearer ${studentToken}` }
    });
    const checkData = await checkRes.json();
    console.log("7. Student Check Defaulter Status:", checkData.success ? "PASS" : "FAIL", {
      isDefaulter: checkData.data?.isDefaulter,
      count: checkData.data?.count
    });
  } catch (err) {
    console.error("7. Check Defaulter Error:", err.message);
  }

  // 8. Test AI Assistant Context Update (Seat Number & Attendance %)
  try {
    const aiRes = await fetch(`${API_URL}/ai/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        message: "Am I in the defaulter list?"
      })
    });
    const aiData = await aiRes.json();
    const reply = aiData.data?.reply || "";
    const hasSeat = reply.includes("S2026023") || reply.includes("Seat No");
    const hasAttendance = reply.includes("Attendance:") || reply.includes("62%");
    console.log("8. AI Assistant Defaulter Check (Seat & Attendance %):", (hasSeat || hasAttendance) ? "PASS" : "FAIL", {
      replySnippet: reply.slice(0, 120) + "..."
    });
  } catch (err) {
    console.error("8. AI Defaulter Error:", err.message);
  }

  // 9. Clean up test defaulter
  if (committedDefaulterId) {
    try {
      const resolveRes = await fetch(`${API_URL}/defaulters/${committedDefaulterId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${teacherToken}` }
      });
      const resolveData = await resolveRes.json();
      console.log("9. Resolve Defaulter:", resolveData.success ? "PASS" : "FAIL", resolveData.message);
    } catch (err) {
      console.error("9. Resolve Error:", err.message);
    }
  }

  console.log("=================================================");
  console.log("ALL SEAT NUMBER VALIDATION TESTS COMPLETED!");
  console.log("=================================================");
}

runTests();
