const request = require("supertest");

const app = require("./server");

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

  test("GET /input/names.json returns array", async () => {
    const res = await request(app).get("/input/names.json");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /input/status.json returns array", async () => {
    const res = await request(app).get("/input/status.json");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /input/selection.json returns array", async () => {
    const res = await request(app).get("/input/selection.json");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
