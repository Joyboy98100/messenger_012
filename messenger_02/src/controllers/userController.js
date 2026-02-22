import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import BlockedUser from "../models/BlockedUser.js";
import ProfilePhotoPrivacy from "../models/ProfilePhotoPrivacy.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

/* UPDATE PROFILE */
export const updateProfile = async (req, res) => {
  try {
    const { id, username, email, bio, preferredLanguage } = req.body;

    let avatarUrl = req.body.avatar;

    // If new avatar uploaded
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "avatars" }
      );
      avatarUrl = uploadRes.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        bio,
        preferredLanguage,
        avatar: avatarUrl,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Keep response shape consistent with login (id instead of _id)
    const userResponse = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      preferredLanguage: updatedUser.preferredLanguage,
    };

    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET USER PROFILE */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "username email avatar bio preferredLanguage"
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const viewerId = req.user;
    const allowed =
      typeof req.profilePhotoAllowed === "boolean"
        ? req.profilePhotoAllowed
        : true;

    const sameUser =
      viewerId && String(viewerId) === String(user._id || userId);

    const avatar =
      allowed || sameUser ? user.avatar : "/default-avatar.png";

    const response = {
      id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      preferredLanguage: user.preferredLanguage,
      avatar,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* SMART USER SEARCH WITH RELATIONSHIP STATUS */
export const searchUsers = async (req, res) => {
  try {
    const viewerId = req.user;
    const rawQuery = (req.query.query || "").trim();

    if (!viewerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!rawQuery) {
      return res.json([]);
    }

    const query = new RegExp(rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // Basic user search (limit results for performance)
    const users = await User.find({
      $or: [
        { username: { $regex: query } },
        { email: { $regex: query } },
      ],
    })
      .select("username email avatar bio")
      .limit(20)
      .lean();

    if (!users.length) {
      return res.json([]);
    }

    const targetIds = users.map((u) => String(u._id));
    const viewerStr = String(viewerId);

    // Friends
    const friends = await Friend.find({
      $or: [
        { user1: viewerId, user2: { $in: targetIds } },
        { user2: viewerId, user1: { $in: targetIds } },
      ],
    }).lean();
    const friendSet = new Set(
      friends.map((f) =>
        String(f.user1) === viewerStr ? String(f.user2) : String(f.user1)
      )
    );

    // Pending friend requests (both directions)
    const requests = await FriendRequest.find({
      status: "pending",
      $or: [
        { sender: viewerId, receiver: { $in: targetIds } },
        { receiver: viewerId, sender: { $in: targetIds } },
      ],
    }).lean();
    const pendingSent = new Set();
    const pendingReceived = new Set();
    const pendingSentMap = new Map();      // otherUserId -> requestId
    const pendingReceivedMap = new Map();  // otherUserId -> requestId

    requests.forEach((r) => {
      const rid = String(r._id);
      const sender = String(r.sender);
      const receiver = String(r.receiver);
      if (sender === viewerStr) {
        pendingSent.add(receiver);
        pendingSentMap.set(receiver, rid);
      } else if (receiver === viewerStr) {
        pendingReceived.add(sender);
        pendingReceivedMap.set(sender, rid);
      }
    });

    // Blocks (either direction)
    const blocks = await BlockedUser.find({
      $or: [
        { blockerId: viewerId, blockedUserId: { $in: targetIds } },
        { blockerId: { $in: targetIds }, blockedUserId: viewerId },
      ],
    }).lean();
    const blockedSet = new Set(
      blocks.map((b) =>
        String(b.blockerId) === viewerStr
          ? String(b.blockedUserId)
          : String(b.blockerId)
      )
    );

    const data = users.map((u) => {
      const id = String(u._id);
      let status = "none";
      let requestId = null;

      if (id === viewerStr) {
        status = "self";
      } else if (blockedSet.has(id)) {
        status = "blocked";
      } else if (friendSet.has(id)) {
        status = "friends";
      } else if (pendingSent.has(id)) {
        status = "pending_sent";
        requestId = pendingSentMap.get(id) || null;
      } else if (pendingReceived.has(id)) {
        status = "pending_received";
        requestId = pendingReceivedMap.get(id) || null;
      }

      return {
        _id: u._id,
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        bio: u.bio,
        status,
        requestId,
      };
    });

    return res.json(data);
  } catch (err) {
    console.error("SEARCH USERS ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* GET DISCOVER USERS - Only users who are NOT friends, NOT pending request, NOT blocked, NOT self */
export const getDiscoverUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Step 1: Find all accepted friends
    const friendRelations = await Friend.find({
      $or: [{ user1: currentUser }, { user2: currentUser }],
    }).lean();

    const friendIds = new Set();
    friendRelations.forEach((f) => {
      const user1Str = String(f.user1);
      const user2Str = String(f.user2);
      const currentStr = String(currentUser);
      if (user1Str === currentStr) {
        friendIds.add(user2Str);
      } else {
        friendIds.add(user1Str);
      }
    });

    // Step 2: Find all pending friend requests involving current user
    const pendingRequests = await FriendRequest.find({
      status: "pending",
      $or: [{ sender: currentUser }, { receiver: currentUser }],
    }).lean();

    const pendingRequestIds = new Set();
    pendingRequests.forEach((r) => {
      const senderStr = String(r.sender);
      const receiverStr = String(r.receiver);
      const currentStr = String(currentUser);
      if (senderStr === currentStr) {
        pendingRequestIds.add(receiverStr);
      } else {
        pendingRequestIds.add(senderStr);
      }
    });

    // Step 2.5: Also exclude users who have messages (they should be in Recent Chats, not Discover)
    // This ensures no duplication between Discover and Recent Chats
    const messagesWithUsers = await Message.find({
      $or: [{ sender: currentUser }, { receiver: currentUser }],
      group: { $exists: false }, // Only 1-on-1 messages
    })
      .select("sender receiver")
      .lean();

    const usersWithMessages = new Set();
    messagesWithUsers.forEach((msg) => {
      const senderStr = String(msg.sender);
      const receiverStr = String(msg.receiver);
      const currentStr = String(currentUser);
      if (senderStr === currentStr) {
        usersWithMessages.add(receiverStr);
      } else {
        usersWithMessages.add(senderStr);
      }
    });

    // Step 3: Find blocked users (either direction)
    const blockedRelations = await BlockedUser.find({
      $or: [{ blockerId: currentUser }, { blockedUserId: currentUser }],
    }).lean();

    const blockedIds = new Set();
    blockedRelations.forEach((b) => {
      const blockerStr = String(b.blockerId);
      const blockedStr = String(b.blockedUserId);
      const currentStr = String(currentUser);
      if (blockerStr === currentStr) {
        blockedIds.add(blockedStr);
      } else {
        blockedIds.add(blockerStr);
      }
    });

    // Step 4: Combine all excluded IDs
    const excludedIds = new Set([
      String(currentUser), // Exclude self
      ...friendIds,
      ...pendingRequestIds,
      ...usersWithMessages, // Exclude users with messages (they belong in Recent Chats)
      ...blockedIds,
    ]);

    // Step 5: Query Users collection excluding all excluded IDs
    const users = await User.find({
      _id: { $nin: Array.from(excludedIds) },
    })
      .select("username email avatar bio")
      .lean();

    // Apply profile photo privacy: viewer is NOT in contacts of these users
    const userIds = users.map((u) => u._id);
    const settings = await ProfilePhotoPrivacy.find({
      userId: { $in: userIds },
    }).lean();
    const settingMap = new Map(
      settings.map((s) => [String(s.userId), s.profilePhoto])
    );

    const sanitized = users.map((u) => {
      const obj = u.toObject ? u.toObject() : u;
      const rule = settingMap.get(String(obj._id)) || "everyone";

      // Non-contacts: only "everyone" shows avatar; others default
      if (rule === "everyone") return obj;
      return { ...obj, avatar: "/default-avatar.png" };
    });

    return res.json(sanitized);
  } catch (err) {
    console.error("GET DISCOVER USERS ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* GET CONTACTS - Only accepted friends */
export const getContacts = async (req, res) => {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Find all FriendRequest documents where status = "accepted" and currentUser is involved
    const acceptedRequests = await FriendRequest.find({
      status: "accepted",
      $or: [{ sender: currentUser }, { receiver: currentUser }],
    })
      .populate("sender", "username avatar email")
      .populate("receiver", "username avatar email")
      .lean();

    // Extract the OTHER user from each accepted request
    const contacts = [];
    const currentStr = String(currentUser);

    acceptedRequests.forEach((req) => {
      const senderStr = String(req.sender._id || req.sender);
      const receiverStr = String(req.receiver._id || req.receiver);

      if (senderStr === currentStr) {
        contacts.push(req.receiver);
      } else {
        contacts.push(req.sender);
      }
    });

    // Apply profile photo privacy (everyone / contacts / nobody)
    const contactIds = contacts.map((u) => u._id || u);
    const settings = await ProfilePhotoPrivacy.find({
      userId: { $in: contactIds },
    }).lean();

    const settingMap = new Map(
      settings.map((s) => [String(s.userId), s.profilePhoto])
    );

    const sanitized = contacts.map((u) => {
      const obj = u.toObject ? u.toObject() : u;
      const rule = settingMap.get(String(obj._id)) || "everyone";

      // For friends, "contacts" and "everyone" allow real avatar
      if (rule === "nobody") {
        return { ...obj, avatar: "/default-avatar.png" };
      }
      return obj;
    });

    return res.json(sanitized);
  } catch (err) {
    console.error("GET CONTACTS ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};