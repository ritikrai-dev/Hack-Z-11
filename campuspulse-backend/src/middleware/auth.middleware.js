import { verifyAccessToken } from "../utils/jwt.js";
import { failure } from "../utils/response.js";
import { mockDatabase } from "../services/mockData.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    const token = header.substring(7).trim();
    if (token === "demo-token" || token === "guest-token") {
      req.user = mockDatabase.currentUser;
      return next();
    }
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    } catch {
      return failure(res, "Invalid or expired session token. Please log in again.", 401);
    }
  }

  // Fallback if userId or studentId is provided in request body
  if (req.body?.userId || req.body?.studentId) {
    const id = req.body.userId || req.body.studentId;
    const found = mockDatabase.users.find(u => u.studentId === id || u.id === id);
    if (found) {
      req.user = { sub: found.id, studentId: found.studentId, role: found.role, name: found.name };
      return next();
    }
  }

  // Fallback for demo/development compatibility
  req.user = mockDatabase.currentUser;
  next();
}

