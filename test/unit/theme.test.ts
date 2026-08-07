import sinon from "sinon";
import {
  applyTheme,
  isThemePreference,
  nextPreference,
  readPreference,
  resolveTheme,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  type ThemePreference,
  type ThemeStorage,
  writePreference,
} from "../../src/lib/theme";

function makeStorage(stored: string | null = null): ThemeStorage {
  return { getItem: sinon.stub().returns(stored), setItem: sinon.spy() };
}

function makeRoot() {
  return { classList: { toggle: sinon.spy() } };
}

describe("isThemePreference", () => {
  it("accepts the three known preferences", () => {
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
  });
  it("rejects unknown values", () => {
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe("THEME_PREFERENCES", () => {
  it("lists the three preferences in cycle order", () => {
    expect(THEME_PREFERENCES).toEqual(["system", "light", "dark"]);
  });
  it("steps through every entry via nextPreference without repeating", () => {
    const visited: ThemePreference[] = [];
    let current: ThemePreference = THEME_PREFERENCES[0];
    for (let i = 0; i < THEME_PREFERENCES.length; i++) {
      visited.push(current);
      current = nextPreference(current);
    }
    expect(new Set(visited).size).toBe(THEME_PREFERENCES.length);
    expect(current).toBe(THEME_PREFERENCES[0]);
  });
});

describe("nextPreference", () => {
  it("steps system → light", () => {
    expect(nextPreference("system")).toBe("light");
  });
  it("steps light → dark", () => {
    expect(nextPreference("light")).toBe("dark");
  });
  it("wraps dark → system", () => {
    expect(nextPreference("dark")).toBe("system");
  });
  it("returns to the starting point after a full cycle", () => {
    const start: ThemePreference = "system";
    expect(nextPreference(nextPreference(nextPreference(start)))).toBe(start);
  });
});

describe("resolveTheme", () => {
  it("follows the OS when the preference is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
  it("keeps an explicit light preference even when the OS is dark", () => {
    expect(resolveTheme("light", true)).toBe("light");
  });
  it("keeps an explicit dark preference even when the OS is light", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("readPreference", () => {
  it("returns a stored preference", () => {
    expect(readPreference(makeStorage("dark"))).toBe("dark");
  });
  it("falls back to system when nothing is stored", () => {
    expect(readPreference(makeStorage(null))).toBe("system");
  });
  it("falls back to system when the stored value is unrecognized", () => {
    expect(readPreference(makeStorage("solarized"))).toBe("system");
  });
  it("falls back to system when storage is unavailable", () => {
    expect(readPreference(null)).toBe("system");
  });
  it("falls back to system when reading throws, as private browsing does", () => {
    const storage: ThemeStorage = {
      getItem: sinon.stub().throws(new Error("access denied")),
      setItem: sinon.spy(),
    };
    expect(readPreference(storage)).toBe("system");
  });
});

describe("writePreference", () => {
  it("persists under the shared storage key", () => {
    const storage = makeStorage();
    writePreference(storage, "light");
    expect(
      (storage.setItem as sinon.SinonSpy).calledOnceWithExactly(THEME_STORAGE_KEY, "light"),
    ).toBe(true);
  });
  it("reports success when the write lands", () => {
    expect(writePreference(makeStorage(), "dark")).toBe(true);
  });
  it("reports failure instead of throwing when storage is unavailable", () => {
    expect(writePreference(null, "dark")).toBe(false);
  });
  it("reports failure instead of throwing when the quota is exceeded", () => {
    const storage: ThemeStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub().throws(new Error("QuotaExceededError")),
    };
    expect(writePreference(storage, "dark")).toBe(false);
  });
});

describe("applyTheme", () => {
  it("adds the dark class for the dark theme", () => {
    const root = makeRoot();
    applyTheme(root, "dark");
    expect(root.classList.toggle.calledOnceWithExactly("dark", true)).toBe(true);
  });
  it("removes the dark class for the light theme", () => {
    const root = makeRoot();
    applyTheme(root, "light");
    expect(root.classList.toggle.calledOnceWithExactly("dark", false)).toBe(true);
  });
});
