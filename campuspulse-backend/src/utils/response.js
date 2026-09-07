export function success(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function failure(res, message, statusCode = 400, error = undefined) {
  const body = { success: false, message };
  if (error && process.env.NODE_ENV !== "production") body.error = error;
  return res.status(statusCode).json(body);
}
