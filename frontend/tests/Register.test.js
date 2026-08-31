/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with missing email", async () => {
      const registerSpy = vi.spyOn(authServices, "registerUser");
      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[name="fName"]').setValue("Jane");
      await wrapper.find('input[name="lName"]').setValue("Doe");
      await wrapper.find('input[name="username"]').setValue("jdoe");
      await wrapper.find('input[name="password"]').setValue("password123");
      await wrapper.find('input[name="confirmPassword"]').setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Email is required.");
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("User submits registration with invalid email format", async () => {
      const registerSpy = vi.spyOn(authServices, "registerUser");
      const { wrapper } = await mountWithPlugins(Register);

      const fNameInput = wrapper.find('input[name="fName"]');
      const lNameInput = wrapper.find('input[name="lName"]');
      const emailInput = wrapper.find('input[name="email"]');
      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const confirmPasswordInput = wrapper.find('input[name="confirmPassword"]');

      await fNameInput.setValue("Jane");
      await lNameInput.setValue("Doe");
      await emailInput.setValue("notanemail");
      await usernameInput.setValue("jdoe");
      await passwordInput.setValue("password123");
      await confirmPasswordInput.setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const registerSpy = vi.spyOn(authServices, "registerUser");
      const { wrapper } = await mountWithPlugins(Register);

      const fNameInput = wrapper.find('input[name="fName"]');
      const lNameInput = wrapper.find('input[name="lName"]');
      const emailInput = wrapper.find('input[name="email"]');
      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const confirmPasswordInput = wrapper.find('input[name="confirmPassword"]');

      await fNameInput.setValue("Jane");
      await lNameInput.setValue("Doe");
      await emailInput.setValue("jane@example.com");
      await usernameInput.setValue("");
      await passwordInput.setValue("password123");
      await confirmPasswordInput.setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is required.");
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const registerSpy = vi.spyOn(authServices, "registerUser");
      const { wrapper } = await mountWithPlugins(Register);

      const fNameInput = wrapper.find('input[name="fName"]');
      const lNameInput = wrapper.find('input[name="lName"]');
      const emailInput = wrapper.find('input[name="email"]');
      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const confirmPasswordInput = wrapper.find('input[name="confirmPassword"]');

      await fNameInput.setValue("Jane");
      await lNameInput.setValue("Doe");
      await emailInput.setValue("jane@example.com");
      await usernameInput.setValue("jdoe");
      await passwordInput.setValue("short");
      await confirmPasswordInput.setValue("short");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const registerSpy = vi.spyOn(authServices, "registerUser");
      const { wrapper } = await mountWithPlugins(Register);

      const fNameInput = wrapper.find('input[name="fName"]');
      const lNameInput = wrapper.find('input[name="lName"]');
      const emailInput = wrapper.find('input[name="email"]');
      const usernameInput = wrapper.find('input[name="username"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const confirmPasswordInput = wrapper.find('input[name="confirmPassword"]');

      await fNameInput.setValue("Jane");
      await lNameInput.setValue("Doe");
      await emailInput.setValue("jane@example.com");
      await usernameInput.setValue("jdoe");
      await passwordInput.setValue("password123");
      await confirmPasswordInput.setValue("differentpassword");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(registerSpy).not.toHaveBeenCalled();
    });

    it("User registers with a duplicate username", async () => {
      vi.spyOn(authServices, "registerUser").mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: "Username is already taken." },
        },
      });

      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[name="fName"]').setValue("Jane");
      await wrapper.find('input[name="lName"]').setValue("Doe");
      await wrapper.find('input[name="email"]').setValue("jane.other@example.com");
      await wrapper.find('input[name="username"]').setValue("jdoe");
      await wrapper.find('input[name="password"]').setValue("password123");
      await wrapper.find('input[name="confirmPassword"]').setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      const alert = wrapper.find(".v-alert");
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toContain("Username is already taken.");
    });

    it("User registers with a duplicate email", async () => {
      vi.spyOn(authServices, "registerUser").mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: "Email is already registered." },
        },
      });

      const { wrapper } = await mountWithPlugins(Register);

      await wrapper.find('input[name="fName"]').setValue("Jane");
      await wrapper.find('input[name="lName"]').setValue("Doe");
      await wrapper.find('input[name="email"]').setValue("jane@example.com");
      await wrapper.find('input[name="username"]').setValue("newuser");
      await wrapper.find('input[name="password"]').setValue("password123");
      await wrapper.find('input[name="confirmPassword"]').setValue("password123");

      await wrapper.find("form").trigger("submit.prevent");
      await flushPromises();

      const alert = wrapper.find(".v-alert");
      expect(alert.exists()).toBe(true);
      expect(alert.text()).toContain("Email is already registered.");
    });
  });
});
