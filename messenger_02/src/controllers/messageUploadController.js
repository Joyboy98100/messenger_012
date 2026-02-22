import mongoose from "mongoose";
import Message from "../models/Message.js";
import FriendRequest from "../models/FriendRequest.js";

// POST /api/messages/upload
export const uploadFile = async (req, res) => {
  try {
    const { senderId, receiverId, messageType } = req.body;

    if (!senderId || !receiverId || !req.file) {
      return res
        .status(400)
        .json({ message: "senderId, receiverId and file are required" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // Ensure users are friends (reuse same rule as text messages)
    const friendship = await FriendRequest.findOne({
      status: "accepted",
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).lean();

    if (!friendship) {
      return res
        .status(403)
        .json({ message: "You can only send media to friends" });
    }

    let type = "file";
    if (messageType === "image") type = "image";
    else if (messageType === "video") type = "video";

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = `/uploads/${req.file.filename}`;
    const fileUrl = `${baseUrl}${relativePath}`;
    const fileName = req.file.originalname;
    const fileSize = `${Math.round(req.file.size / 1024)} KB`;

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: type,
      type: type,
      fileUrl,
      fileName,
      fileSize,
      text: "",
    });

    const savedMessage = await message.save();

    // Emit to receiver so they see the message in chat, and new_message to both for Shared Media
    try {
      const io = req.app.get("io");
      const onlineUsers = req.app.get("onlineUsers") || {};
      if (io) {
        const messagePayload = savedMessage.toObject ? savedMessage.toObject() : { ...savedMessage };
        const receiverSocket = onlineUsers[String(receiverId)];
        if (receiverSocket) {
          io.to(receiverSocket).emit("receiveMessage", {
            senderId: String(senderId),
            message: messagePayload,
          });
        }
        const newMessagePayload = {
          _id: savedMessage._id,
          senderId: String(savedMessage.sender),
          receiverId: String(savedMessage.receiver),
          messageType: savedMessage.messageType || savedMessage.type,
          fileUrl: savedMessage.fileUrl,
          fileName: savedMessage.fileName,
          fileSize: savedMessage.fileSize,
          text: savedMessage.text || "",
          createdAt: savedMessage.createdAt,
        };
        io.to(String(receiverId)).emit("new_message", newMessagePayload);
        io.to(String(senderId)).emit("new_message", newMessagePayload);
      }
    } catch (err) {
      console.error("Error emitting for upload:", err);
    }

    // Ensure response also has fully-qualified URL
    const response = {
      ...savedMessage.toObject(),
      fileUrl,
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error("UPLOAD MESSAGE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

