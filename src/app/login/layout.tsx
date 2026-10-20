import { getNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = getNoIndexMetadata(
  "Sign in",
  "Log in to your Manageo workspace to sync your tasks, notes and money data."
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
