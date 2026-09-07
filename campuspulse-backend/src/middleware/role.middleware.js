import { failure } from "../utils/response.js";

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return failure(res, "Forbidden", 403);
    }
    next();
  };
}
