"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ConfigProvider, theme } from "antd";
import { useReducedMotion } from "framer-motion";

const ThemeContext = createContext({ dark: false, toggleTheme: () => {} });

export function useAppTheme() {
  return useContext(ThemeContext);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
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
  );
}
