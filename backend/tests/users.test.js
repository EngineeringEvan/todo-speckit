/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const profileBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  ...overrides,
});

describe("Feature 4 — User Profile API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const { user, authHeader } = await registerUser({
        username: "jdoe",
        email: "jdoe@example.com",
      });

      const res = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader)
        .send(profileBody({ fName: "Janet", email: "janet@example.com" }));

      expect(res.status).toBe(200);
      expect(res.body.fName).toBe("Janet");
      expect(res.body.email).toBe("janet@example.com");
      expect(res.body.password).toBeUndefined();
    });

    it("User fetches their own profile", async () => {
      const { user, authHeader } = await registerUser({
        username: "jdoe",
        email: "jdoe@example.com",
      });

      const res = await request(app)
        .get(`/todo/users/${user.userId}`)
        .set(authHeader);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(user.userId);
      expect(res.body.username).toBe("jdoe");
      expect(res.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      const res = await request(app)
        .get(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`User with id=${userB.user.userId} not found.`);
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
        fName: "Bob",
      });

      const res = await request(app)
        .put(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader)
        .send(profileBody({ fName: "Hacked" }));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe(`User with id=${userB.user.userId} not found.`);

      const stillB = await db.user.findByPk(userB.user.userId);
      expect(stillB.fName).toBe("Bob");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/todo/users/1");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const { user, authHeader } = await registerUser();

      const res = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader)
        .send({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password must be at least 8 characters.");
    });

    it("Profile update rejects missing required fields", async () => {
      const { user, authHeader } = await registerUser({ fName: "Keep" });

      const res = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader)
        .send({ lName: "Doe", email: "keep@example.com", username: "keepuser" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("First name is required.");

      const stored = await db.user.findByPk(user.userId);
      expect(stored.fName).toBe("Keep");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send(profileBody({
          username: "userb",
          email: "usera@example.com",
        }));

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is already taken.");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });
      await registerUser({
        username: "userb",
        email: "b@example.com",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send(profileBody({
          username: "usera",
          email: "b@example.com",
        }));

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is already registered.");
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app)
        .put("/todo/users/1")
        .send(profileBody());

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });
});
