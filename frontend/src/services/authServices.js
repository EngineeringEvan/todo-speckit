import apiClient from "./services.js";

export default {
  loginUser(credentials) {
    return apiClient.post("login", credentials);
  },
  registerUser(payload) {
    return apiClient.post("register", payload);
  },
  logoutUser() {
    return apiClient.post("logout");
  },
};
