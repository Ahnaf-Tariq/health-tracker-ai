import { connection } from "next/server";
import { LandingPage } from "../components/LandingPage";

export default async function HomePage() {
  // Render per request so the Content Security Policy nonce matches the HTML.
  await connection();
  return <LandingPage />;
}
