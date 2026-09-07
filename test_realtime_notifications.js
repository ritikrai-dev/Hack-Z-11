// Automated End-to-End Test Suite: Real-Time Synchronization & Multi-Role Notification Engine
import socketPkg from "./campuspulse-mobile/node_modules/socket.io-client/dist/socket.io.js";
const io = socketPkg.io || socketPkg;

const BASE_URL = "http://localhost:5000";

async function runTestSuite() {
  console.log("================================================================");
  console.log("🧪 RUNNING CAMPUSPULSE REAL-TIME NOTIFICATION & SYNC TEST SUITE");
  console.log("================================================================\n");

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  // 1. Authenticate Student and Teacher via Real Auth API
  console.log("1️⃣ Authenticating Student (Ritik Sharma - 2023CS042)...");
  const studentLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "2023CS042",
      password: "student123",
      expectedRole: "STUDENT"
    })
  });
  const studentLoginData = await studentLoginRes.json();
  const studentToken = studentLoginData.token || studentLoginData.data?.token;
  assert(!!studentToken, "Obtained authentic JWT token for student 2023CS042");

  console.log("   Authenticating Teacher (Dr. Arvind Rao - TCH101)...");
  const teacherLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "TCH101",
      password: "teacher123",
      expectedRole: "TEACHER"
    })
  });
  const teacherLoginData = await teacherLoginRes.json();
  const teacherToken = teacherLoginData.token || teacherLoginData.data?.token;
  assert(!!teacherToken, "Obtained authentic JWT token for teacher TCH101");

  // 2. Connect Socket.io Client with Student JWT Handshake
  console.log("\n2️⃣ Connecting Socket.io Client with JWT Handshake...");
  const socket = io(BASE_URL, {
    transports: ["websocket", "polling"],
    auth: { token: studentToken },
    reconnection: false
  });

  const receivedEvents = {
    connect: false,
    newNotification: [],
    noticeCreated: [],
    eventCreated: [],
    defaulterAlert: [],
    aiCacheInvalidate: []
  };

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Socket connection timed out")), 5000);

    socket.on("connect", () => {
      clearTimeout(timeout);
      receivedEvents.connect = true;
      console.log(`   🔌 Socket connected with ID: ${socket.id}`);
      resolve();
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  assert(receivedEvents.connect === true, "Socket client authenticated and joined rooms via JWT handshake");

  // Register real-time listeners
  socket.on("notification:new", (data) => {
    receivedEvents.newNotification.push(data);
  });
  socket.on("notice:created", (data) => {
    receivedEvents.noticeCreated.push(data);
  });
  socket.on("event:created", (data) => {
    receivedEvents.eventCreated.push(data);
  });
  socket.on("defaulter:alert", (data) => {
    receivedEvents.defaulterAlert.push(data);
  });
  socket.on("ai:cache:invalidate", (data) => {
    receivedEvents.aiCacheInvalidate.push(data);
  });

  // 3. Publish Notice via HTTP API and verify real-time dispatch
  console.log("\n3️⃣ Triggering Notice Publication API (/api/v1/notices)...");
  const noticeRes = await fetch(`${BASE_URL}/api/v1/notices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: "Mid-Term Exam Circular 2026",
      category: "Academic",
      urgency: "high",
      department: "Computer Science & Engineering",
      content: "All students must submit assignments before next Monday.",
      aiSummary: "Mid-term exam guidelines and assignment deadline submission."
    })
  });
  const noticeData = await noticeRes.json();
  assert(noticeRes.status === 201 && noticeData.success, "Teacher successfully created notice via HTTP endpoint");

  // Wait for real-time propagation
  await new Promise((r) => setTimeout(r, 600));

  assert(receivedEvents.noticeCreated.length > 0, "Socket received 'notice:created' event in real-time");
  assert(receivedEvents.newNotification.length > 0, "Socket received 'notification:new' toast event");
  assert(receivedEvents.aiCacheInvalidate.length > 0, "Socket received 'ai:cache:invalidate' signal");

  // 4. Publish Event via HTTP API and verify real-time dispatch
  console.log("\n4️⃣ Triggering Event Creation API (/api/v1/events)...");
  const eventRes = await fetch(`${BASE_URL}/api/v1/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      title: "Autonomous Robotics Sprint 2026",
      organizer: "Robotics Club",
      venue: "Auditorium Hall B",
      date: "Oct 5, 2026",
      category: "Technical",
      capacity: 120,
      scope: "INTRA-COLLEGE"
    })
  });
  const eventData = await eventRes.json();
  assert(eventRes.status === 201 && eventData.success, "Event successfully created via HTTP endpoint");

  await new Promise((r) => setTimeout(r, 600));
  assert(receivedEvents.eventCreated.length > 0, "Socket received 'event:created' broadcast in real-time");

  // 5. Publish Defaulter Notice with Seat Number and verify targeted student alert
  console.log("\n5️⃣ Triggering Defaulter Publishing (/api/v1/defaulters/publish)...");
  const defaulterRes = await fetch(`${BASE_URL}/api/v1/defaulters/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      subject: "Computer Networks",
      attendanceThreshold: 75,
      records: [
        {
          seatNumber: "S2023042",
          studentName: "Ritik Sharma",
          attendancePercentage: 58.5,
          subject: "Computer Networks",
          notes: "Missed 8 consecutive laboratory sessions"
        }
      ]
    })
  });
  const defaulterData = await defaulterRes.json();
  assert((defaulterRes.status === 200 || defaulterRes.status === 201) && defaulterData.success, "Defaulter list published with Seat Number validation");

  await new Promise((r) => setTimeout(r, 600));
  assert(receivedEvents.defaulterAlert.length > 0, "Targeted student received real-time 'defaulter:alert'");

  // 6. Test Notification REST API Endpoints
  console.log("\n6️⃣ Testing Notification REST APIs...");
  const listRes = await fetch(`${BASE_URL}/api/v1/notifications`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const listData = await listRes.json();
  assert(listRes.status === 200 && listData.success, "Fetched user targeted notification inbox");
  assert(listData.data?.notifications?.length > 0, `Inbox has ${listData.data?.notifications?.length} notifications`);

  const unreadRes = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const unreadData = await unreadRes.json();
  assert(unreadRes.status === 200 && unreadData.data?.unreadCount > 0, `Unread count correctly calculated: ${unreadData.data?.unreadCount}`);

  // Mark first notification as read
  const targetId = listData.data.notifications[0].id;
  const readRes = await fetch(`${BASE_URL}/api/v1/notifications/${targetId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const readData = await readRes.json();
  assert(readRes.status === 200 && readData.data?.notification?.isRead === true, "Notification successfully marked as read via PATCH");

  // Mark all read
  const markAllRes = await fetch(`${BASE_URL}/api/v1/notifications/mark-all-read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const markAllData = await markAllRes.json();
  assert(markAllRes.status === 200 && markAllData.success, "Mark all notifications read via POST");

  // Verify unread count is now 0
  const afterCountRes = await fetch(`${BASE_URL}/api/v1/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const afterCountData = await afterCountRes.json();
  assert(afterCountData.data?.unreadCount === 0, "Unread count updated to 0 after mark-all-read");

  socket.disconnect();

  console.log("\n================================================================");
  console.log(`📊 TEST SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log("================================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
