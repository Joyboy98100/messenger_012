import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  preferredLanguage: {
    type: String,
    default: "English",
  },
  online: {
    type: Boolean,
    default: false,
  },
  // Realtime presence + last seen tracking
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
