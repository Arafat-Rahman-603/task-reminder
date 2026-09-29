import { headers } from "next/headers";

type Language = "es" | "en";

export async function getServerLanguage(): Promise<Language> {
  const reqHeaders = await headers();
  return (reqHeaders.get("x-language") || "es") as Language;
}
