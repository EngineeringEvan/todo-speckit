/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server.js";
import db from "../app/models/index.js";
import authConfig from "../app/config/auth.config.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

describe("Feature 1 — Authentication Middleware", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${userA.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await registerUser({
        username: "usera",
        email: "usera@example.com",
      });

      const userB = await registerUser({
        username: "userb",
        email: "userb@example.com",
      });

      await db.list.create({
        name: "User A List",
        userId: userA.user.userId,
      });

      await db.list.create({
        name: "User B List",
        userId: userB.user.userId,
      });

      const resA = await request(app)
        .get("/todo/lists")
        .set(userA.authHeader);

      expect(resA.status).toBe(200);
      expect(resA.body).toHaveLength(1);
      expect(resA.body[0].name).toBe("User A List");
      expect(resA.body[0].userId).toBe(userA.user.userId);
    });

    it("Expired or invalid session token", async () => {
      const expiredToken = jwt.sign(
        { userId: 999, email: "expired@example.com" },
        authConfig.secret,
        { expiresIn: "0s" }
      );

      const user = await db.user.create({
        fName: "Expired",
        lName: "User",
        email: "expired@example.com",
        username: "expireduser",
        password: "hashedpassword",
        role: "worker",
      });

      await db.session.create({
        token: expiredToken,
        email: "expired@example.com",
        expirationDate: new Date(Date.now() - 1000),
        userId: user.id,
      });

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });
});
