import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      language?: string;
      accountType?: string;
      timezone?: string;
      isPlatformAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    language?: string;
    accountType?: string;
    timezone?: string;
    isPlatformAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    language?: string;
    accountType?: string;
    timezone?: string;
    isPlatformAdmin?: boolean;
  }
}
