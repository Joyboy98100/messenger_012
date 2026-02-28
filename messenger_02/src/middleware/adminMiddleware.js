export const requireAdmin = (req, res, next) => {
  try {
    const role = req.userRole;
    if (!role || (role !== "admin" && role !== "superadmin")) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Admin access required" });
  }
};

