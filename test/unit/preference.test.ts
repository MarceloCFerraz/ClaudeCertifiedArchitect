import sinon from "sinon";
import {
  nextInCycle,
  type PreferenceStorage,
  readStoredPreference,
  writeStoredPreference,
} from "../../src/lib/preference";

const KEY = "cca-f-test";
const ALLOWED = ["one", "two", "three"] as const;

function makeStorage(stored: string | null = null): PreferenceStorage {
  return { getItem: sinon.stub().returns(stored), setItem: sinon.spy() };
}

describe("readStoredPreference", () => {
  it("returns a stored value that is in the allowed list", () => {
    expect(readStoredPreference(makeStorage("two"), KEY, ALLOWED, "one")).toBe("two");
  });
  it("falls back when nothing is stored", () => {
    expect(readStoredPreference(makeStorage(null), KEY, ALLOWED, "one")).toBe("one");
  });
  it("falls back when the stored value is not allowed", () => {
    expect(readStoredPreference(makeStorage("four"), KEY, ALLOWED, "one")).toBe("one");
  });
  it("falls back when storage is unavailable", () => {
    expect(readStoredPreference(null, KEY, ALLOWED, "one")).toBe("one");
  });
  it("falls back when reading throws, as private browsing does", () => {
    const storage: PreferenceStorage = {
      getItem: sinon.stub().throws(new Error("access denied")),
      setItem: sinon.spy(),
    };
    expect(readStoredPreference(storage, KEY, ALLOWED, "one")).toBe("one");
  });
  it("reads the key it was given", () => {
    const storage = makeStorage("two");
    readStoredPreference(storage, KEY, ALLOWED, "one");
    expect((storage.getItem as sinon.SinonStub).calledOnceWithExactly(KEY)).toBe(true);
  });
});

describe("writeStoredPreference", () => {
  it("writes under the key it was given", () => {
    const storage = makeStorage();
    writeStoredPreference(storage, KEY, "two");
    expect((storage.setItem as sinon.SinonSpy).calledOnceWithExactly(KEY, "two")).toBe(true);
  });
  it("reports success when the write lands", () => {
    expect(writeStoredPreference(makeStorage(), KEY, "two")).toBe(true);
  });
  it("reports failure instead of throwing when storage is unavailable", () => {
    expect(writeStoredPreference(null, KEY, "two")).toBe(false);
  });
  it("reports failure instead of throwing when the quota is exceeded", () => {
    const storage: PreferenceStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub().throws(new Error("QuotaExceededError")),
    };
    expect(writeStoredPreference(storage, KEY, "two")).toBe(false);
  });
});

describe("nextInCycle", () => {
  it("steps to the next value", () => {
    expect(nextInCycle(ALLOWED, "one")).toBe("two");
  });
  it("wraps at the end", () => {
    expect(nextInCycle(ALLOWED, "three")).toBe("one");
  });
  it("starts the cycle over for a value that is not in it", () => {
    expect(nextInCycle(ALLOWED, "four" as (typeof ALLOWED)[number])).toBe("one");
  });
  it("returns to the starting point after a full cycle", () => {
    expect(nextInCycle(ALLOWED, nextInCycle(ALLOWED, nextInCycle(ALLOWED, "one")))).toBe("one");
  });
});
