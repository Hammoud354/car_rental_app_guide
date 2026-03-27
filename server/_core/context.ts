import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
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
    const sessionCookie = opts.req.cookies?.[COOKIE_NAME];

    if (sessionCookie) {
      if (sessionCookie.startsWith('user-')) {
        const userId = parseInt(sessionCookie.replace('user-', ''), 10);
        if (!isNaN(userId)) {
          const { getUserById } = await import('../db');
          const dbUser = await getUserById(userId);
          if (dbUser) {
            user = dbUser;
          }
        }
      }
    }
  } catch (error) {
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
