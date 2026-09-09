function authorize(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.platformRole || 'user';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { authorize };