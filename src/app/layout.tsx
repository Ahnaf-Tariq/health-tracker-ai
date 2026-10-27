import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import localFont from "next/font/local";
import { AppProviders } from "../components/AppProviders";
import "./globals.css";

const dmSans = localFont({
  src: "./fonts/DMSans-Variable.ttf",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    {
      path: "./fonts/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Health Tracker — Your private check-in",
  description:
    "A private, plain-language health check-in with transparent, rules-based explanations. Optional account-based chat history is saved in Firebase; messages and attached report context are sent to Google Gemini when you chat.",
  icons: { icon: "/pulse-mark.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f8f9f6",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} min-w-80 scroll-smooth font-sans text-base font-normal antialiased scheme-light selection:bg-[#cde5da] selection:text-[#203533] dark:scheme-dark [font-synthesis:none] [text-rendering:optimizeLegibility] motion-reduce:scroll-auto [&_*]:motion-reduce:animate-none [&_*]:motion-reduce:transition-none`}
    >
      <body
        suppressHydrationWarning
        className="m-0 min-w-80 bg-paper text-base leading-[1.6] text-ink print:bg-white print:text-[#1e302b]"
      >
        <AntdRegistry>
          <AppProviders>{children}</AppProviders>
        </AntdRegistry>
      </body>
    </html>
  );
}
