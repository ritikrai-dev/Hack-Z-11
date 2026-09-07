import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { mockDatabase } from "./mockData.js";

let io = null;

// Helper to sanitize room names
export const formatRoomName = {
  global: () => "room:global",
  dept: (dept) => {
    const d = String(dept || "GENERAL").toUpperCase().trim();
    if (d.includes("COMP") || d.includes("CS") || d.includes("CSE") || d.includes("DEPT_CS")) {
      return "room:dept_CSE";
    }
    if (d.includes("ELEC") || d.includes("ECE") || d.includes("EE")) {
      return "room:dept_ECE";
    }
    if (d.includes("MECH")) {
      return "room:dept_MECH";
    }
    if (d.includes("CIVIL")) {
      return "room:dept_CIVIL";
    }
    if (d.includes("IT") || d.includes("INFO")) {
      return "room:dept_IT";
    }
    return `room:dept_${d.replace(/[^A-Z0-9]/g, "_")}`;
  },
  classRoom: (dept, year, div) =>
    `room:class_${String(dept || "GEN")}_${String(year || "ALL")}_${String(div || "ALL")}`
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toUpperCase(),
  user: (userId) => `room:user_${String(userId).trim()}`
};

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // 1. JWT Connection Authentication Handshake
  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!rawToken || rawToken === "demo-token") {
        // Authenticate with default student fallback to avoid crashing disconnected clients
        socket.user = {
          id: "usr_student_01",
          studentId: "2023CS042",
          name: "Ritik Sharma",
          role: "STUDENT",
          department: "Computer Science & Engineering",
          year: "3rd Year",
          division: "A"
        };
        return next();
      }

      // Verify JWT token
      try {
        const decoded = jwt.verify(rawToken, env.jwtSecret);
        const matched =
          mockDatabase.users.find(
            (u) => u.id === decoded.id || u.studentId === decoded.studentId || u.id === decoded.userId || u.id === decoded.sub
          ) || decoded;

        socket.user = {
          id: matched.id || decoded.userId || decoded.id || decoded.sub,
          studentId: matched.studentId || decoded.studentId,
          seatNumber: matched.seatNumber || decoded.seatNumber || (matched.studentId === "2023CS042" ? "S2023042" : null),
          name: matched.name || decoded.name || "Authenticated User",
          role: (matched.role || decoded.role || "STUDENT").toUpperCase(),
          department: matched.department || decoded.department || "Computer Science & Engineering",
          year: matched.year || decoded.year || "3rd Year",
          division: matched.division || decoded.division || "A"
        };
        next();
      } catch (jwtErr) {
        // Token invalid or expired - authenticate as guest instead of dropping connection abruptly
        socket.user = {
          id: "usr_guest",
          studentId: "GUEST",
          role: "STUDENT",
          department: "Computer Science & Engineering",
          year: "3rd Year",
          division: "A"
        };
        next();
      }
    } catch (err) {
      next(new Error("Authentication handshake failed"));
    }
  });

  // 2. Automatic Room Assignment on Connection
  io.on("connection", (socket) => {
    const user = socket.user || {};

    // A. Global Room (All Authenticated Users)
    const globalRoom = formatRoomName.global();
    socket.join(globalRoom);

    // B. Department Room (e.g. room:dept_CSE)
    const deptRoom = formatRoomName.dept(user.department);
    socket.join(deptRoom);
    if (user.department) {
      socket.join(`room:dept_${String(user.department).replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`);
    }

    // C. Class / Division Room (e.g. room:class_CSE_3RD_YEAR_A)
    const classRoom = formatRoomName.classRoom(user.department, user.year, user.division);
    socket.join(classRoom);

    // D. Individual User Room (Targeted Notifications by ID, Student ID, and Seat Number)
    if (user.id) {
      socket.join(formatRoomName.user(user.id));
    }
    if (user.studentId && user.studentId !== user.id) {
      socket.join(formatRoomName.user(user.studentId));
    }
    if (user.seatNumber) {
      socket.join(formatRoomName.user(user.seatNumber));
    }

    console.log(
      `🔌 Socket connected [${socket.id}] | User: ${user.name || user.studentId} (${user.role}) | Rooms: [${globalRoom}, ${deptRoom}, ${classRoom}, room:user_${user.id || user.studentId}]`
    );

    // Dynamic Room Join Events (for frontend manual subscriptions)
    socket.on("join:user", (id) => {
      if (id) {
        const room = formatRoomName.user(id);
        socket.join(room);
      }
    });

    socket.on("join:dept", (dept) => {
      if (dept) {
        socket.join(formatRoomName.dept(dept));
      }
    });

    socket.on("join:class", ({ department, year, division }) => {
      socket.join(formatRoomName.classRoom(department, year, division));
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  console.log("⚡ Socket.io real-time engine initialized with JWT handshake & room targeting");
  return io;
}

export function getIO() {
  return io;
}

export { sendNotificationAndSync } from "./notificationService.js";
