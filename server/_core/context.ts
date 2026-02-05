import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  filterUserId?: number | null; // For Super Admin to filter by specific user
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Check for session cookie first
    const sessionCookie = opts.req.cookies?.[COOKIE_NAME];
    
    if (sessionCookie) {
      // Check if it's a user-{id} format cookie
      if (sessionCookie.startsWith('user-')) {
        const userId = parseInt(sessionCookie.replace('user-', ''), 10);
        if (!isNaN(userId)) {
          // Fetch user from database
          const { getUserById } = await import('../db');
          const dbUser = await getUserById(userId);
          if (dbUser) {
            user = dbUser;
          }
        }
      } else if (sessionCookie === 'simple-session-mo') {
        // Legacy simple session support
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
      }
    }
    
    // If no session cookie or user not found, fall back to OAuth
    if (!user) {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Check for filterUserId header (sent by Super Admin frontend)
  const filterUserIdHeader = opts.req.headers['x-filter-user-id'];
  const filterUserId = filterUserIdHeader && filterUserIdHeader !== 'null' 
    ? parseInt(filterUserIdHeader as string, 10) 
    : null;

  return {
    req: opts.req,
    res: opts.res,
    user,
    filterUserId: !isNaN(filterUserId as number) ? filterUserId : undefined,
  };
}
