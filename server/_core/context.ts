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
    // Check for simple session cookie first
    const sessionCookie = opts.req.cookies?.[COOKIE_NAME];
    if (sessionCookie === 'simple-session-mo') {
      // Return a mock user for simple authentication
      user = {
        id: 1,
        openId: 'mo',
        name: 'Mo',
        email: 'mo@rental.os',
        loginMethod: 'simple',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    } else {
      // Fall back to OAuth authentication
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
