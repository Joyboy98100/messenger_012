import UserLanguage from "../models/UserLanguage.js";
import User from "../models/User.js";

const DISPLAY_TO_CODE = {
  English: "en",
  Hindi: "hi",
  Gujarati: "gu",
  Spanish: "es",
  French: "fr",
  German: "de",
};

/** POST /api/user/language — save preferred language for current user */
export const saveLanguage = async (req, res) => {
  try {
    const userId = req.user;
    const { preferredLanguage } = req.body;

    if (!preferredLanguage) {
      return res.status(400).json({ message: "preferredLanguage is required" });
    }

    const code = DISPLAY_TO_CODE[preferredLanguage] ?? preferredLanguage;

    let doc = await UserLanguage.findOneAndUpdate(
      { userId },
      { preferredLanguage: code },
      { new: true, upsert: true }
    );

    // Keep User.preferredLanguage in sync for backward compatibility
    await User.findByIdAndUpdate(userId, {
      preferredLanguage: preferredLanguage,
    });

    return res.json({
      preferredLanguage: doc.preferredLanguage,
      displayName: preferredLanguage,
    });
  } catch (err) {
    console.error("saveLanguage error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};

/** GET /api/user/language/:userId — get saved language for a user */
export const getLanguage = async (req, res) => {
  try {
    const { userId } = req.params;

    const doc = await UserLanguage.findOne({ userId }).lean();
    if (doc) {
      return res.json({
        preferredLanguage: doc.preferredLanguage,
      });
    }

    // Fallback to User.preferredLanguage
    const user = await User.findById(userId).select("preferredLanguage").lean();
    const display = user?.preferredLanguage || "English";
    const code = DISPLAY_TO_CODE[display] ?? "en";
    return res.json({ preferredLanguage: code });
  } catch (err) {
    console.error("getLanguage error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};
