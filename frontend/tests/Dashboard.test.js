/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

function clickByText(wrapper, text) {
  const match = wrapper.findAll("button").find((btn) => btn.text().includes(text));
  if (match) {
    return match.trigger("click");
  }

  const bodyButtons = [...document.body.querySelectorAll("button")];
  const found = bodyButtons.find((btn) => btn.textContent.includes(text));
  found?.click();
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      vi.spyOn(listServices, "getAll")
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Groceries", userId: 1 }],
        });
      const createSpy = vi.spyOn(listServices, "createList").mockResolvedValue({
        data: { id: 1, name: "Groceries", userId: 1 },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.findAll("button").find((btn) => btn.text().includes("+ New List")).trigger("click");
      await flushPromises();

      const nameInput = document.body.querySelector("input");
      nameInput.value = "Groceries";
      nameInput.dispatchEvent(new Event("input"));
      await flushPromises();

      clickByText(wrapper, "Create");
      await flushPromises();

      expect(createSpy).toHaveBeenCalledWith({ name: "Groceries" });
      expect(document.body.textContent).toContain("Groceries");
      wrapper.unmount();
    });

    it("User creates a list with an empty name", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({ data: [] });
      const createSpy = vi.spyOn(listServices, "createList");

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.findAll("button").find((btn) => btn.text().includes("+ New List")).trigger("click");
      await flushPromises();

      clickByText(wrapper, "Create");
      await flushPromises();

      expect(document.body.textContent).toContain("List name is required.");
      expect(createSpy).not.toHaveBeenCalled();
      wrapper.unmount();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
      wrapper.unmount();
    });

    it("User has no lists", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({ data: [] });

      const { wrapper } = await mountWithPlugins(Dashboard);
      await flushPromises();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      wrapper.unmount();
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountWithPlugins(Dashboard);
      await flushPromises();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
      wrapper.unmount();
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      vi.spyOn(listServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Groceries", userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Shopping", userId: 1 }],
        });
      const updateSpy = vi.spyOn(listServices, "updateList").mockResolvedValue({
        data: { id: 1, name: "Shopping", userId: 1 },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.find('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const inputs = [...document.body.querySelectorAll("input")];
      const nameInput = inputs[inputs.length - 1];
      nameInput.value = "Shopping";
      nameInput.dispatchEvent(new Event("input"));
      await flushPromises();

      clickByText(wrapper, "Save");
      await flushPromises();

      expect(updateSpy).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(document.body.textContent).toContain("Shopping");
      wrapper.unmount();
    });

    it("User deletes a list", async () => {
      vi.spyOn(listServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 1, name: "Groceries", userId: 1 }],
        })
        .mockResolvedValueOnce({ data: [] });
      const deleteSpy = vi.spyOn(listServices, "deleteList").mockResolvedValue({
        data: { message: "List deleted successfully." },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.find('[aria-label="Delete list"]').trigger("click");
      await flushPromises();

      clickByText(wrapper, "Delete");
      await flushPromises();

      expect(deleteSpy).toHaveBeenCalledWith(1);
      expect(document.body.textContent).toContain("No lists yet. Create your first list.");
      wrapper.unmount();
    });
  });
});
