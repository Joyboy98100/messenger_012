import User from "../models/User.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";
import { createAuditLog } from "../utils/createAuditLog.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalMessages, bannedUsers, activeUsers24h, openReports] =
      await Promise.all([
        User.countDocuments({}),
        Message.countDocuments({}),
        User.countDocuments({ isBanned: true }),
        User.countDocuments({
          lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        Report.countDocuments({ status: "open" }),
      ]);

    return res.json({
      totalUsers,
      totalMessages,
      bannedUsers,
      activeUsers24h,
      openReports,
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    return res.status(500).json({ message: "Failed to load dashboard stats" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("username email role bio avatar isOnline lastSeen createdAt isBanned")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [totalMessages, reportsResult] = await Promise.all([
      Message.countDocuments({ sender: user._id }),
      Report.aggregate([
        { $lookup: { from: "messages", localField: "messageId", foreignField: "_id", as: "msg" } },
        { $unwind: "$msg" },
        { $match: { "msg.sender": user._id } },
        { $count: "count" },
      ]),
    ]);

    const reportsCount = reportsResult[0]?.count ?? 0;

    return res.json({
      ...user,
      totalMessages,
      reportsCount,
    });
  } catch (err) {
    console.error("ADMIN GET USER ERROR:", err);
    return res.status(500).json({ message: "Failed to load user" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "20", 10), 1),
      100
    );
    const search = (req.query.search || "").trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const role = req.query.role?.trim();
    if (role) filter.role = role;
    const status = req.query.status?.trim();
    if (status === "banned") filter.isBanned = true;
    else if (status === "active") filter.isBanned = { $ne: true };

    const sortBy = req.query.sort || "createdAt";
    const sortOrder = req.query.order === "asc" ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("username email role isOnline lastSeen createdAt isBanned avatar bio")
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      users: items,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    return res.status(500).json({ message: "Failed to load users" });
  }
};

export const banUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (String(targetId) === String(req.user)) {
      return res.status(400).json({ message: "Cannot ban yourself" });
    }

    const user = await User.findByIdAndUpdate(
      targetId,
      { isBanned: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAuditLog({
      adminId: req.user,
      actionType: "BAN_USER",
      targetUserId: user._id,
      req,
    });

    return res.json({ message: "User banned", user });
  } catch (err) {
    console.error("BAN USER ERROR:", err);
    return res.status(500).json({ message: "Failed to ban user" });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      targetId,
      { isBanned: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAuditLog({
      adminId: req.user,
      actionType: "UNBAN_USER",
      targetUserId: user._id,
      req,
    });

    return res.json({ message: "User unbanned", user });
  } catch (err) {
    console.error("UNBAN USER ERROR:", err);
    return res.status(500).json({ message: "Failed to unban user" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      targetId,
      { isOnline: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAuditLog({
      adminId: req.user,
      actionType: "DEACTIVATE_USER",
      targetUserId: user._id,
      req,
    });

    return res.json({ message: "User deactivated", user });
  } catch (err) {
    console.error("DEACTIVATE USER ERROR:", err);
    return res.status(500).json({ message: "Failed to deactivate user" });
  }
};

export const forceLogoutUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      targetId,
      { $inc: { jwtVersion: 1 } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAuditLog({
      adminId: req.user,
      actionType: "FORCE_LOGOUT",
      targetUserId: user._id,
      req,
    });

    return res.json({ message: "User sessions invalidated" });
  } catch (err) {
    console.error("FORCE LOGOUT ERROR:", err);
    return res.status(500).json({ message: "Failed to force logout user" });
  }
};

