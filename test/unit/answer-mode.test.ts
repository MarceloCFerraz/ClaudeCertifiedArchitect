import sinon from "sinon";
import {
  ANSWER_MODE_STORAGE_KEY,
  ANSWER_MODES,
  isAnswerMode,
  nextAnswerMode,
  readAnswerMode,
  writeAnswerMode,
} from "../../src/lib/answer-mode";
import type { PreferenceStorage } from "../../src/lib/preference";
import { THEME_STORAGE_KEY } from "../../src/lib/theme";

function makeStorage(stored: string | null = null): PreferenceStorage {
  return { getItem: sinon.stub().returns(stored), setItem: sinon.spy() };
}

describe("ANSWER_MODES", () => {
  it("lists submit then instant", () => {
    expect(ANSWER_MODES).toEqual(["submit", "instant"]);
  });
});

describe("isAnswerMode", () => {
  it("accepts the two known modes", () => {
    expect(isAnswerMode("submit")).toBe(true);
    expect(isAnswerMode("instant")).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isAnswerMode("immediate")).toBe(false);
    expect(isAnswerMode(null)).toBe(false);
  });
});

describe("nextAnswerMode", () => {
  it("flips submit to instant", () => {
    expect(nextAnswerMode("submit")).toBe("instant");
  });
  it("flips instant back to submit", () => {
    expect(nextAnswerMode("instant")).toBe("submit");
  });
});

describe("readAnswerMode", () => {
  it("returns a stored mode", () => {
    expect(readAnswerMode(makeStorage("instant"))).toBe("instant");
  });
  it("defaults to submit when nothing is stored", () => {
    expect(readAnswerMode(makeStorage(null))).toBe("submit");
  });
  it("defaults to submit when the stored value is unrecognized", () => {
    expect(readAnswerMode(makeStorage("immediate"))).toBe("submit");
  });
  it("defaults to submit when storage is unavailable", () => {
    expect(readAnswerMode(null)).toBe("submit");
  });
});

describe("writeAnswerMode", () => {
  it("persists under its own storage key", () => {
    const storage = makeStorage();
    writeAnswerMode(storage, "instant");
    expect(
      (storage.setItem as sinon.SinonSpy).calledOnceWithExactly(ANSWER_MODE_STORAGE_KEY, "instant"),
    ).toBe(true);
  });
  it("does not share the theme's storage key", () => {
    expect(ANSWER_MODE_STORAGE_KEY).not.toBe(THEME_STORAGE_KEY);
  });
});
