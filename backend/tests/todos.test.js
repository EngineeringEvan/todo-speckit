/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

describe("Feature 3 — Todo API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader)
        .send({ title: "Buy milk" });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Buy milk");
      expect(res.body.completed).toBe(false);
      expect(res.body.userId).toBe(user.userId);
      expect(res.body.listId).toBe(list.id);
    });

    it("User adds a todo with an empty title", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader)
        .send({ title: "  " });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Todo title is required.");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      const listA = await db.list.create({ name: "Work", userId: userA.user.userId });
      const listB = await db.list.create({ name: "Work", userId: userB.user.userId });

      await db.todo.create({
        title: "My task",
        listId: listA.id,
        userId: userA.user.userId,
      });
      await db.todo.create({
        title: "Their task",
        listId: listB.id,
        userId: userB.user.userId,
      });

      const res = await request(app)
        .get(`/todo/lists/${listA.id}/todos`)
        .set(userA.authHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("My task");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        completed: false,
        listId: list.id,
        userId: user.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        completed: true,
        listId: list.id,
        userId: user.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader)
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader)
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.userId,
      });

      const res = await request(app)
        .delete(`/todo/todos/${todo.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.findByPk(todo.id)).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({ name: "Secret", userId: userB.user.userId });
      await db.todo.create({
        title: "Hidden task",
        listId: listB.id,
        userId: userB.user.userId,
      });

      const res = await request(app)
        .get(`/todo/lists/${listB.id}/todos`)
        .set(userA.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${listB.id} not found.`);
      expect(JSON.stringify(res.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({ name: "Secret", userId: userB.user.userId });

      const res = await request(app)
        .post(`/todo/lists/${listB.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Intruder task" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${listB.id} not found.`);
      expect(await db.todo.count({ where: { listId: listB.id } })).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({ name: "Secret", userId: userB.user.userId });
      const todoB = await db.todo.create({
        title: "Hidden task",
        listId: listB.id,
        userId: userB.user.userId,
      });

      const res = await request(app)
        .put(`/todo/todos/${todoB.id}`)
        .set(userA.authHeader)
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Todo with id=${todoB.id} not found.`);
      await todoB.reload();
      expect(todoB.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({ name: "Secret", userId: userB.user.userId });
      const todoB = await db.todo.create({
        title: "Hidden task",
        listId: listB.id,
        userId: userB.user.userId,
      });

      const res = await request(app)
        .delete(`/todo/todos/${todoB.id}`)
        .set(userA.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Todo with id=${todoB.id} not found.`);
      expect(await db.todo.findByPk(todoB.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const list = await db.list.create({
        name: "Groceries",
        userId: userA.user.userId,
      });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(userA.authHeader)
        .send({ title: "Buy milk", userId: 999 });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.user.userId);
      expect(res.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      await db.todo.create({ title: "Buy milk", listId: list.id, userId: user.userId });
      await db.todo.create({ title: "Buy eggs", listId: list.id, userId: user.userId });

      const res = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.count({ where: { listId: list.id } })).toBe(0);
    });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader)
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBe("2026-07-15");
    });

    it("User adds a todo without a due date", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader)
        .send({ title: "Buy milk" });

      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .post(`/todo/lists/${list.id}/todos`)
        .set(authHeader)
        .send({ title: "Task", dueDate: "not-a-date" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/due date/i);
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.userId,
        dueDate: null,
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader)
        .send({ dueDate: "2026-07-20" });

      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.userId,
        dueDate: "2026-07-20",
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader)
        .send({ dueDate: null });

      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });
      const todo = await db.todo.create({
        title: "Buy milk",
        listId: list.id,
        userId: user.userId,
        dueDate: "2026-07-15",
      });

      const res = await request(app)
        .put(`/todo/todos/${todo.id}`)
        .set(authHeader)
        .send({ dueDate: "2026-99-99" });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/due date/i);
      await todo.reload();
      expect(todo.dueDate).toBe("2026-07-15");
    });

    it("User cannot set due date on another user's todo", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({ name: "Secret", userId: userB.user.userId });
      const todoB = await db.todo.create({
        title: "Hidden",
        listId: listB.id,
        userId: userB.user.userId,
        dueDate: null,
      });

      const res = await request(app)
        .put(`/todo/todos/${todoB.id}`)
        .set(userA.authHeader)
        .send({ dueDate: "2026-07-15" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`Todo with id=${todoB.id} not found.`);
      await todoB.reload();
      expect(todoB.dueDate).toBeNull();
    });
  });
});
