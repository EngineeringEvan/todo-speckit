/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase } from "./helpers.js";

describe("Feature 1 — Auth API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const payload = {
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        password: "password123",
      };

      const res = await request(app)
        .post("/todo/register")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("userId");
      expect(res.body.username).toBe("jdoe");
      expect(res.body.email).toBe("jdoe@example.com");
      expect(res.body.fName).toBe("Jane");
      expect(res.body.lName).toBe("Doe");
      expect(res.body.role).toBe("worker");
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
      expect(res.body.password).toBeUndefined();

      const userInDb = await db.user.unscoped().findOne({
        where: { username: "jdoe" },
      });
      expect(userInDb).not.toBeNull();
      expect(userInDb.password).not.toBe("password123");
      const isPasswordHashed = await bcrypt.compare("password123", userInDb.password);
      expect(isPasswordHashed).toBe(true);

      const sessionInDb = await db.session.findOne({
        where: { userId: userInDb.id },
      });
      expect(sessionInDb).not.toBeNull();
      expect(sessionInDb.token).toBe(res.body.token);
    });

    it("User submits registration with missing email", async () => {
      const payload = {
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        password: "password123",
      };

      const res = await request(app)
        .post("/todo/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is required.");
    });

    it("User submits registration with password too short", async () => {
      const payload = {
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        password: "short",
      };

      const res = await request(app)
        .post("/todo/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password must be at least 8 characters.");
    });

    it("User registers with a duplicate username", async () => {
      await db.user.create({
        fName: "Existing",
        lName: "User",
        email: "existing@example.com",
        username: "jdoe",
        password: await bcrypt.hash("password123", 10),
        role: "worker",
      });

      const payload = {
        fName: "Jane",
        lName: "Doe",
        email: "jane.other@example.com",
        username: "jdoe",
        password: "password123",
      };

      const res = await request(app)
        .post("/todo/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is already taken.");
    });

    it("User registers with a duplicate email", async () => {
      await db.user.create({
        fName: "Existing",
        lName: "User",
        email: "jane@example.com",
        username: "existinguser",
        password: await bcrypt.hash("password123", 10),
        role: "worker",
      });

      const payload = {
        fName: "Jane",
        lName: "Doe",
        email: "jane@example.com",
        username: "newuser",
        password: "password123",
      };

      const res = await request(app)
        .post("/todo/register")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email is already registered.");
    });
  });

  describe("US-1.2 — Sign in", () => {
    beforeEach(async () => {
      await db.user.create({
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        password: await bcrypt.hash("password123", 10),
        role: "worker",
      });
    });

    it("User signs in with valid credentials", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({
          username: "jdoe",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("userId");
      expect(res.body.username).toBe("jdoe");
      expect(res.body.email).toBe("jdoe@example.com");
      expect(res.body.fName).toBe("Jane");
      expect(res.body.lName).toBe("Doe");
      expect(res.body.role).toBe("worker");
      expect(res.body).toHaveProperty("token");

      const session = await db.session.findOne({
        where: { userId: res.body.userId, token: res.body.token },
      });
      expect(session).not.toBeNull();
    });

    it("User signs in with invalid password", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({
          username: "jdoe",
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Username is required.");
    });

    it("User signs in with missing password", async () => {
      const res = await request(app)
        .post("/todo/login")
        .send({
          username: "jdoe",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Password is required.");
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const registerRes = await request(app)
        .post("/todo/register")
        .send({
          fName: "Signout",
          lName: "User",
          email: "signout@example.com",
          username: "signoutuser",
          password: "password123",
        });

      const token = registerRes.body.token;

      const logoutRes = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toBe("Signed out successfully.");

      const session = await db.session.findOne({
        where: { userId: registerRes.body.userId },
      });
      expect(session.token).toBe("");
    });
  });
});
