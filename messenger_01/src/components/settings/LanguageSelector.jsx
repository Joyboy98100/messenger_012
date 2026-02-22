import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Gujarati",
  "Spanish",
  "French",
  "German",
];

const CODE_TO_NAME = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
  es: "Spanish",
  fr: "French",
  de: "German",
};

export default function LanguageSelector() {
  const { preferredLanguage, setPreferredLanguage, refreshLanguage } = useLanguage();
  const [selected, setSelected] = useState(
    CODE_TO_NAME[preferredLanguage] || "English"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(CODE_TO_NAME[preferredLanguage] || "English");
  }, [preferredLanguage]);

  const handleChange = async (e) => {
    const value = e.target.value;
    setSelected(value);
    setSaving(true);
    try {
      await axios.post("/user/language", { preferredLanguage: value });
      const codeMap = { English: "en", Hindi: "hi", Gujarati: "gu", Spanish: "es", French: "fr", German: "de" };
      setPreferredLanguage(codeMap[value] || "en");
      await refreshLanguage();
    } catch (err) {
      console.error("Failed to save language:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 dark:text-neutral-100">
        Translation language
      </h3>
      <p className="text-sm text-gray-500 dark:text-neutral-400">
        Incoming messages will be auto-translated to this language.
      </p>
      <select
        value={selected}
        onChange={handleChange}
        disabled={saving}
        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 border border-gray-300 dark:border-neutral-600 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {saving && (
        <p className="text-xs text-gray-500 dark:text-neutral-400">Saving...</p>
      )}
    </div>
  );
}
