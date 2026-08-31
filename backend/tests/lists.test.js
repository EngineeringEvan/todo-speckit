/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

describe("Feature 2 — Todo List API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { user, authHeader } = await registerUser();

      const res = await request(app)
        .post("/todo/lists")
        .set(authHeader)
        .send({ name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Groceries");
      expect(res.body.userId).toBe(user.userId);
    });

    it("User creates a list with an empty name", async () => {
      const { authHeader } = await registerUser();

      const res = await request(app)
        .post("/todo/lists")
        .set(authHeader)
        .send({ name: "   " });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("List name is required.");
    });

    it("User creates a list with a name that is too long", async () => {
      const { authHeader } = await registerUser();

      const res = await request(app)
        .post("/todo/lists")
        .set(authHeader)
        .send({ name: "a".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("List name must be 100 characters or fewer.");
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { user, authHeader } = await registerUser();

      await db.list.create({ name: "Work", userId: user.userId });
      await db.list.create({ name: "Personal", userId: user.userId });

      const res = await request(app).get("/todo/lists").set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      await db.list.create({ name: "Secret Project", userId: userB.user.userId });
      await db.list.create({ name: "Mine", userId: userA.user.userId });

      const res = await request(app).get("/todo/lists").set(userA.authHeader);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Mine");
      expect(res.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .put(`/todo/lists/${list.id}`)
        .set(authHeader)
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Shopping");
      expect(res.body.id).toBe(list.id);
    });

    it("User deletes a list", async () => {
      const { user, authHeader } = await registerUser();
      const list = await db.list.create({ name: "Groceries", userId: user.userId });

      const res = await request(app)
        .delete(`/todo/lists/${list.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(res.status);

      const remaining = await db.list.findByPk(list.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({
        name: "Secret Project",
        userId: userB.user.userId,
      });

      const res = await request(app)
        .put(`/todo/lists/${listB.id}`)
        .set(userA.authHeader)
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${listB.id} not found.`);

      await listB.reload();
      expect(listB.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });
      const listB = await db.list.create({
        name: "Secret Project",
        userId: userB.user.userId,
      });

      const res = await request(app)
        .delete(`/todo/lists/${listB.id}`)
        .set(userA.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`List with id=${listB.id} not found.`);

      const stillThere = await db.list.findByPk(listB.id);
      expect(stillThere).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });

      const res = await request(app)
        .post("/todo/lists")
        .set(userA.authHeader)
        .send({ name: "Groceries", userId: 999 });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.user.userId);
      expect(res.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });
});
