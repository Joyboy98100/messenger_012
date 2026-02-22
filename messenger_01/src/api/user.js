import axios from "axios";

export const updateProfile = (formData) =>
  axios.put("http://localhost:5000/api/user/update", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
