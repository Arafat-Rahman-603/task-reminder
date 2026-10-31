import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          language: user.preferences?.language || 'es',
          accountType: user.accountType || 'individual',
          timezone: user.preferences?.timezone || 'UTC'
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      if (account?.provider === "google") {
        await dbConnect();
        
        // Find or create user
        const normalizedEmail = user.email?.toLowerCase().trim();
        let dbUser = await User.findOne({ email: normalizedEmail });
        if (!dbUser) {
          dbUser = await User.create({
            email: normalizedEmail,
            name: user.name || "User",
            image: user.image,
            provider: "google",
            emailVerified: new Date(),
            accountType: "individual" // default for google signup
          });

          // Provision personal workspace for Google signup
          try {
            const { default: Workspace } = await import("@/models/Workspace");
            const { default: WorkspaceMembership } = await import("@/models/WorkspaceMembership");
            const personalWorkspace = await Workspace.create({
              name: "Personal Workspace",
              type: "personal",
              ownerId: dbUser._id,
            });
            await WorkspaceMembership.create({
              workspaceId: personalWorkspace._id,
              userId: dbUser._id,
              role: "owner",
            });
          } catch (e) {
            console.error("Google signin workspace creation failed", e);
          }
        } else {
          // Google OAuth verified this email. Ensure emailVerified and provider reflect Google login.
          let updated = false;
          
          if (!dbUser.emailVerified) {
            dbUser.emailVerified = new Date();
            updated = true;
          }
          
          if (!dbUser.provider) {
            dbUser.provider = "google";
            updated = true;
          } else if (!dbUser.provider.includes("google")) {
            dbUser.provider = `${dbUser.provider},google`;
            updated = true;
          }

          if (user.image && !dbUser.image) {
            dbUser.image = user.image;
            updated = true;
          }

          if (updated) {
            await dbUser.save();
          }
        }
        
        user.id = dbUser._id.toString();
        user.name = dbUser.name;
        user.image = dbUser.image;
        user.language = dbUser.preferences?.language || 'es';
        user.accountType = dbUser.accountType || 'individual';
        user.timezone = dbUser.preferences?.timezone || 'UTC';
        return true;
      }
      return true; // allow credentials signin
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        token.language = user.language;
        token.accountType = user.accountType;
        token.timezone = user.timezone;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      if (trigger === "update" && session?.image) {
        token.image = session.image;
      }
      if (trigger === "update" && session?.language) {
        token.language = session.language;
      }
      if (trigger === "update" && session?.timezone) {
        token.timezone = session.timezone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        if (token.image) session.user.image = token.image as string;
        session.user.language = token.language;
        session.user.accountType = token.accountType;
        session.user.timezone = token.timezone;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
