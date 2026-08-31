/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      vi.spyOn(authServices, "loginUser").mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const { wrapper } = await mountWithPlugins(Login);

      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');

      await usernameInput.setValue("jdoe");
      await passwordInput.setValue("wrongpassword");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      const alert = wrapper.find(".v-alert");
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toContain("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const loginSpy = vi.spyOn(authServices, "loginUser");
      const { wrapper } = await mountWithPlugins(Login);

      const passwordInput = wrapper.find('input[name="password"]');
      await passwordInput.setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is required.");
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const loginSpy = vi.spyOn(authServices, "loginUser");
      const { wrapper } = await mountWithPlugins(Login);

      const usernameInput = wrapper.find('input[name="username"]');
      await usernameInput.setValue("jdoe");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password is required.");
      expect(loginSpy).not.toHaveBeenCalled();
    });
  });
});
