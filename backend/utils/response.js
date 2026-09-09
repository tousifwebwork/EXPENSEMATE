function successResponse(res, statusCode = 200, payload = {}) {
  return res.status(statusCode).json({ success: true, ...payload });
}

module.exports = { successResponse };
