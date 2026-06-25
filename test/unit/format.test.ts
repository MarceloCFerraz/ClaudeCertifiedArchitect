import { fmtTime, pad2, stamp } from "../../src/lib/format";

describe("pad2", () => {
  it("pads single digits to two", () => {
    expect(pad2(3)).toBe("03");
  });
  it("leaves two-digit numbers unchanged", () => {
    expect(pad2(42)).toBe("42");
  });
});

describe("stamp", () => {
  it("formats a date as YYYYMMDD-HHMMSS", () => {
    expect(stamp(new Date(2026, 5, 24, 22, 31, 5))).toBe("20260624-223105");
  });
});

describe("fmtTime", () => {
  it("omits hours when under an hour", () => {
    expect(fmtTime(5 * 60 + 9)).toBe("05:09");
  });
  it("includes hours when an hour or more", () => {
    expect(fmtTime(3600 + 5 * 60 + 9)).toBe("1:05:09");
  });
  it("formats zero", () => {
    expect(fmtTime(0)).toBe("00:00");
  });
});
