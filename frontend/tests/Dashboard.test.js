/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";

function clickByText(wrapper, text) {
  const match = wrapper.findAll("button").find((btn) => btn.text().trim() === text);
  if (match) {
    return match.trigger("click");
  }

  const bodyButtons = [...document.body.querySelectorAll("button")];
  const found = bodyButtons.find((btn) => btn.textContent.trim() === text);
  found?.click();
}

function clickAria(label) {
  const el = document.body.querySelector(`[aria-label="${label}"]`);
  el?.click();
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

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
        });
      const createSpy = vi.spyOn(todoServices, "createTodo").mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();

      clickByText(wrapper, "+ Add Item");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(fields.length - 2).setValue("Buy milk");
      await flushPromises();

      clickByText(wrapper, "Add");
      await flushPromises();

      expect(createSpy).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
      wrapper.unmount();
    });

    it("User adds a todo with an empty title", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll").mockResolvedValue({ data: [] });
      const createSpy = vi.spyOn(todoServices, "createTodo");

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();
      clickByText(wrapper, "+ Add Item");
      await flushPromises();
      clickByText(wrapper, "Add");
      await flushPromises();

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(createSpy).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it("Add item is only available inside the items dialog", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });

      const { wrapper } = await mountWithPlugins(Dashboard);
      await flushPromises();

      const addItemButtons = wrapper.findAll("button").filter((btn) =>
        btn.text().includes("+ Add Item")
      );
      expect(addItemButtons.length).toBe(0);
      expect(wrapper.text()).toContain("+ New List");
      wrapper.unmount();
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 2, name: "Personal", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll").mockResolvedValue({ data: [] });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("No todos in this list yet.");
      wrapper.unmount();
    });

    it("User opens items for different lists", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });
      vi.spyOn(todoServices, "getAll").mockImplementation((listId) => {
        if (listId === 2) {
          return Promise.resolve({
            data: [{ id: 3, title: "Call mom", completed: false, listId: 2, userId: 1 }],
          });
        }
        return Promise.resolve({
          data: [
            { id: 1, title: "Email client", completed: false, listId: 1, userId: 1 },
            { id: 2, title: "Write report", completed: false, listId: 1, userId: 1 },
          ],
        });
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();

      const itemButtons = wrapper.findAll('[aria-label="Items"]');
      await itemButtons[1].trigger("click");
      await flushPromises();
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      clickByText(wrapper, "Close");
      await flushPromises();

      await itemButtons[0].trigger("click");
      await flushPromises();
      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      wrapper.unmount();
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: true, listId: 1, userId: 1 }],
        });
      const updateSpy = vi.spyOn(todoServices, "updateTodo").mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: true },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();

      clickAria("Toggle Buy milk");
      await flushPromises();

      expect(updateSpy).toHaveBeenCalledWith(10, { completed: true });
      wrapper.unmount();
    });

    it("User marks a completed todo as incomplete", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: true, listId: 1, userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
        });
      const updateSpy = vi.spyOn(todoServices, "updateTodo").mockResolvedValue({
        data: { id: 10, title: "Buy milk", completed: false },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();

      clickAria("Toggle Buy milk");
      await flushPromises();

      expect(updateSpy).toHaveBeenCalledWith(10, { completed: false });
      wrapper.unmount();
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy oat milk", completed: false, listId: 1, userId: 1 }],
        });
      const updateSpy = vi.spyOn(todoServices, "updateTodo").mockResolvedValue({
        data: { id: 10, title: "Buy oat milk" },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();
      clickAria("Edit todo");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(fields.length - 2).setValue("Buy oat milk");
      await flushPromises();

      clickByText(wrapper, "Save");
      await flushPromises();

      expect(updateSpy).toHaveBeenCalledWith(10, { title: "Buy oat milk", dueDate: null });
      expect(document.body.textContent).toContain("Buy oat milk");
      wrapper.unmount();
    });

    it("User deletes a todo", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, listId: 1, userId: 1 }],
        })
        .mockResolvedValueOnce({ data: [] });
      const deleteSpy = vi.spyOn(todoServices, "deleteTodo").mockResolvedValue({
        data: { message: "Todo deleted successfully." },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, {
        attachTo: document.body,
      });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();
      clickAria("Delete todo");
      await flushPromises();

      const deleteButtons = [...document.body.querySelectorAll("button")].filter((btn) =>
        btn.textContent.trim() === "Delete"
      );
      deleteButtons[deleteButtons.length - 1].click();
      await flushPromises();

      expect(deleteSpy).toHaveBeenCalledWith(10);
      expect(document.body.textContent).toContain("No todos in this list yet.");
      wrapper.unmount();
    });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, dueDate: "2026-07-15", listId: 1, userId: 1 }],
        });
      const createSpy = vi.spyOn(todoServices, "createTodo").mockResolvedValue({
        data: { id: 10, title: "Buy milk", dueDate: "2026-07-15" },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, { attachTo: document.body });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();
      clickByText(wrapper, "+ Add Item");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(fields.length - 2).setValue("Buy milk");
      await fields.at(fields.length - 1).setValue("2026-07-15");
      clickByText(wrapper, "Add");
      await flushPromises();

      expect(createSpy).toHaveBeenCalledWith(1, { title: "Buy milk", dueDate: "2026-07-15" });
      expect(document.body.textContent).toMatch(/Jul 15, 2026|Jul 15/);
      wrapper.unmount();
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, dueDate: null, listId: 1, userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, dueDate: "2026-07-20", listId: 1, userId: 1 }],
        });
      const updateSpy = vi.spyOn(todoServices, "updateTodo").mockResolvedValue({
        data: { id: 10, dueDate: "2026-07-20" },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, { attachTo: document.body });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();
      clickAria("Edit todo");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(fields.length - 1).setValue("2026-07-20");
      clickByText(wrapper, "Save");
      await flushPromises();

      expect(updateSpy).toHaveBeenCalledWith(10, { title: "Buy milk", dueDate: "2026-07-20" });
      wrapper.unmount();
    });

    it("User clears a due date when editing a todo", async () => {
      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll")
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, dueDate: "2026-07-20", listId: 1, userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, title: "Buy milk", completed: false, dueDate: null, listId: 1, userId: 1 }],
        });
      const updateSpy = vi.spyOn(todoServices, "updateTodo").mockResolvedValue({
        data: { id: 10, dueDate: null },
      });

      const { wrapper } = await mountWithPlugins(Dashboard, { attachTo: document.body });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();
      clickAria("Edit todo");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(fields.length - 1).setValue("");
      clickByText(wrapper, "Save");
      await flushPromises();

      expect(updateSpy).toHaveBeenCalledWith(10, { title: "Buy milk", dueDate: null });
      wrapper.unmount();
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dueDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll").mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: false, dueDate, listId: 1, userId: 1 }],
      });

      const { wrapper } = await mountWithPlugins(Dashboard, { attachTo: document.body });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();

      expect(document.body.querySelector(".text-error")).not.toBeNull();
      wrapper.unmount();
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dueDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      vi.spyOn(listServices, "getAll").mockResolvedValue({
        data: [{ id: 1, name: "Groceries", userId: 1 }],
      });
      vi.spyOn(todoServices, "getAll").mockResolvedValue({
        data: [{ id: 10, title: "Buy milk", completed: true, dueDate, listId: 1, userId: 1 }],
      });

      const { wrapper } = await mountWithPlugins(Dashboard, { attachTo: document.body });
      await flushPromises();
      await wrapper.find('[aria-label="Items"]').trigger("click");
      await flushPromises();

      expect(document.body.querySelector(".text-error")).toBeNull();
      wrapper.unmount();
    });
  });
});
