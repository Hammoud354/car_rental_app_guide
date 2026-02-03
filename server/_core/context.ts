import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Check for session cookie
    const sessionCookie = opts.req.cookies?.[COOKIE_NAME];
    
    if (sessionCookie) {
      // Handle hardcoded 'Mo' user for testing
      if (sessionCookie === 'simple-session-mo') {
        const { getUserById } = await import("../db");
        user = await getUserById(1);
      }
      // Handle regular user sessions: user-{id}
      else if (sessionCookie.startsWith('user-')) {
        const userId = parseInt(sessionCookie.replace('user-', ''));
        if (!isNaN(userId)) {
          const { getUserById } = await import("../db");
          user = await getUserById(userId);
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error('[Auth] Failed to authenticate:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
