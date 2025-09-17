// server.test.js
const request = require("supertest");
const app = require("./server");

// Mock pg
jest.mock("pg", () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mClient) };
});

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("Server minimal tests", () => {
  test("GET / serves static files", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Team Availability/);
  });

  test("GET /input/names.json returns 200", async () => {
    const res = await request(app).get("/input/names.json");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /input/status.json returns 200", async () => {
    const res = await request(app).get("/input/status.json");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /input/selection.json returns 200", async () => {
    const res = await request(app).get("/input/selection.json");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /save-history returns 200", async () => {
    const res = await request(app)
      .post("/save-history")
      .send({ dummy: "data" })
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Saved");
  });

  test("POST /save-history with invalid data returns 400", async () => {
    const res = await request(app)
      .post("/save-history")
      .send("not-json")
      .set("Content-Type", "application/json");

    expect([400, 500]).toContain(res.statusCode);
  });
});
