import { connection } from "next/server";
import type { Metadata } from "next";
import App from "../../App";

export const metadata: Metadata = {
  title: "Your private check-in — HealthTracker",
};

export default async function CheckInPage() {
  await connection();
  return <App />;
}
