/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import userServices from "../src/services/userServices.js";
import authServices from "../src/services/authServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

const sampleUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jane@example.com",
  token: "fake-token",
  role: "worker",
};

async function mountMenuBar() {
  Utils.setStore("user", sampleUser);
  const Host = {
    components: { MenuBar },
    template: "<v-app><MenuBar /></v-app>",
  };
  return mountWithPlugins(Host, { attachTo: document.body });
}

function clickText(text) {
  const found = [...document.body.querySelectorAll("button, .v-list-item")].find((el) =>
    el.textContent.trim().includes(text)
  );
  found?.click();
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenuBar();
      await wrapper.find('[aria-label="Profile"]').trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jane@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
      wrapper.unmount();
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();

      expect(document.body.textContent).toContain("First name");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      expect(fields.length).toBeGreaterThan(0);
      wrapper.unmount();
    });

    it("User cancels the edit profile dialog", async () => {
      const updateSpy = vi.spyOn(userServices, "updateUser");
      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(0).setValue("Changed");
      bar.vm.closeEditDialog();
      await flushPromises();

      expect(updateSpy).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
      wrapper.unmount();
    });

    it("User saves profile changes", async () => {
      vi.spyOn(userServices, "updateUser").mockResolvedValue({
        data: {
          id: 1,
          fName: "Janet",
          lName: "Doe",
          email: "janet@example.com",
          username: "jdoe",
          role: "worker",
        },
      });

      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(0).setValue("Janet");
      await bar.vm.saveProfile();
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Janet");
      wrapper.unmount();
    });

    it("User saves profile with invalid email format", async () => {
      const updateSpy = vi.spyOn(userServices, "updateUser");
      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(2).setValue("notanemail");
      await bar.vm.saveProfile();
      await flushPromises();

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(updateSpy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User saves profile with mismatched passwords", async () => {
      const updateSpy = vi.spyOn(userServices, "updateUser");
      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(4).setValue("password123");
      await fields.at(5).setValue("different");
      await bar.vm.saveProfile();
      await flushPromises();

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(updateSpy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("User saves profile with a password that is too short", async () => {
      const updateSpy = vi.spyOn(userServices, "updateUser");
      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(4).setValue("short");
      await fields.at(5).setValue("short");
      await bar.vm.saveProfile();
      await flushPromises();

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(updateSpy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("Profile update API returns an error", async () => {
      vi.spyOn(userServices, "updateUser").mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      bar.vm.openEditDialog();
      await flushPromises();
      await bar.vm.saveProfile();
      await flushPromises();

      expect(document.body.textContent).toContain("Username is already taken.");
      wrapper.unmount();
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const logoutSpy = vi.spyOn(authServices, "logoutUser").mockResolvedValue({});
      const { wrapper, router } = await mountMenuBar();
      const bar = wrapper.findComponent(MenuBar);
      await bar.vm.handleLogout();
      await flushPromises();

      expect(logoutSpy).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
      wrapper.unmount();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenuBar();
      expect(wrapper.text()).not.toContain("Sign out");
      wrapper.unmount();
    });
  });
});
