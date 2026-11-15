import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "light" | "dark";
export type DensityPref = "comfortable" | "compact";

type UiPrefs = {
  theme: ThemePref;
  density: DensityPref;
  setTheme: (theme: ThemePref) => void;
  toggleTheme: () => void;
  setDensity: (density: DensityPref) => void;
  toggleDensity: () => void;
};

const STORAGE_KEY = "julien-getaround:ui-prefs";

type StoredPrefs = {
  theme?: ThemePref;
  density?: DensityPref;
};

function readStored(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredPrefs;
  } catch {
    return {};
  }
}

function writeStored(prefs: StoredPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

function applyToDocument(theme: ThemePref, density: DensityPref) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.dataset.theme = theme;
  root.dataset.density = density;
  root.style.colorScheme = theme;
  // Évite les contrôles natifs (date/search) restés en style sombre
  root.style.setProperty("color-scheme", theme);
}

const UiPrefsContext = createContext<UiPrefs | null>(null);

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const initial = readStored();
  const [theme, setThemeState] = useState<ThemePref>(
    initial.theme === "dark" ? "dark" : "light",
  );
  const [density, setDensityState] = useState<DensityPref>(
    initial.density === "compact" ? "compact" : "comfortable",
  );

  useEffect(() => {
    applyToDocument(theme, density);
    writeStored({ theme, density });
  }, [theme, density]);

  const setTheme = useCallback((next: ThemePref) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const setDensity = useCallback((next: DensityPref) => {
    setDensityState(next);
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityState((current) =>
      current === "compact" ? "comfortable" : "compact",
    );
  }, []);

  const value = useMemo(
    () => ({
      theme,
      density,
      setTheme,
      toggleTheme,
      setDensity,
      toggleDensity,
    }),
    [theme, density, setTheme, toggleTheme, setDensity, toggleDensity],
  );

  return createElement(UiPrefsContext.Provider, { value }, children);
}

export function useUiPrefs(): UiPrefs {
  const ctx = useContext(UiPrefsContext);
  if (!ctx) {
    throw new Error("useUiPrefs doit être utilisé dans UiPrefsProvider");
  }
  return ctx;
}
