"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { ConfigProvider, theme } from "antd";
import { useReducedMotion } from "framer-motion";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { WellnessReport } from "../domain/types";
import { getFirebaseAuth } from "../lib/firebase";

const ThemeContext = createContext({ dark: false, toggleTheme: () => {} });
const THEME_STORAGE_KEY = "health-tracker-theme";
const AuthContext = createContext<{ user: User | null; authReady: boolean }>({
  user: null,
  authReady: false,
});
const CheckInContext = createContext<{
  report: WellnessReport | null;
  setReport: (report: WellnessReport | null) => void;
}>({ report: null, setReport: () => {} });

export function useAppTheme() {
  return useContext(ThemeContext);
}

export const useAuth = () => useContext(AuthContext);
export const useCheckInSession = () => useContext(CheckInContext);

export function AppProviders({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [report, setReport] = useState<WellnessReport | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useLayoutEffect(() => {
    let savedTheme: string | null = null;
    try {
      savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Theme persistence is optional when browser storage is unavailable.
    }

    const savedDark = savedTheme === "dark";
    document.documentElement.dataset.theme = savedDark ? "dark" : "light";
    setDark(savedDark);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;

    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // The theme still works for this session if browser storage is unavailable.
    }
  }, [dark, themeReady]);

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
        setUser(nextUser);
        setAuthReady(true);
      });
    } catch {
      setAuthReady(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, authReady }}>
      <CheckInContext.Provider value={{ report, setReport }}>
        <ThemeContext.Provider
          value={{ dark, toggleTheme: () => setDark((value) => !value) }}
        >
          <ConfigProvider
            theme={{
              algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
              token: {
                colorPrimary: dark ? "#70c2a4" : "#0c4b47",
                colorBgContainer: dark ? "#1a2823" : "#ffffff",
                colorBgElevated: dark ? "#1a2823" : "#ffffff",
                colorText: dark ? "#e4eee9" : "#102d2e",
                colorTextPlaceholder: dark ? "#aabbb4" : "#8da0a3",
                colorBorder: dark ? "#30413a" : "#dfe8e5",
                colorError: dark ? "#f4aaa0" : "#a2342e",
                fontFamily: "var(--font-dm-sans), Arial, sans-serif",
                fontSize: 14,
                fontSizeLG: 14,
                controlHeightLG: 46,
                borderRadius: 8,
                borderRadiusLG: 8,
                motion: !reducedMotion,
              },
              components: {
                Select: {
                  optionHeight: 44,
                  optionFontSize: 14,
                  optionLineHeight: 1.5,
                  optionPadding: "10px 13px",
                  optionSelectedBg: dark ? "#203a30" : "#e7f3ed",
                  optionSelectedColor: dark ? "#e4eee9" : "#102d2e",
                  optionActiveBg: dark ? "#263d33" : "#f1f7f3",
                  activeBorderColor: dark ? "#70c2a4" : "#0c4b47",
                  hoverBorderColor: dark ? "#70c2a4" : "#8db8a7",
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </ThemeContext.Provider>
      </CheckInContext.Provider>
    </AuthContext.Provider>
  );
}
