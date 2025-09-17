const request = require("supertest");
const app = require("./server");

jest.setTimeout(5000);

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

describe("Server tests", () => {
  test("GET / serves static files", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Team Availability/);
  });

  test("GET /input returns 200", async () => {
    const res = await request(app).get("/input/names.json");
    expect(res.statusCode).toBe(200);
  });

  test("POST /save-history writes file successfully", async () => {
    const fs = require("fs");
    const writeFileMock = jest
      .spyOn(fs, "writeFile")
      .mockImplementation((path, data, enc, cb) => cb(null));

    const res = await request(app)
      .post("/save-history")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(200);

    writeFileMock.mockRestore();
  });

  test("POST /save-history returns 500 on error", async () => {
    const fs = require("fs");
    const writeFileMock = jest
      .spyOn(fs, "writeFile")
      .mockImplementation((path, data, enc, cb) => cb(new Error("fail")));

    const res = await request(app)
      .post("/save-history")
      .send({ test: "data" })
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(500);

    writeFileMock.mockRestore();
  });
});
