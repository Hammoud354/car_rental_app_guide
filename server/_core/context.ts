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
  const rawFilterUserId = filterUserIdHeader && filterUserIdHeader !== 'null'
    ? parseInt(filterUserIdHeader as string, 10)
    : null;
  const resolvedFilterUserId = rawFilterUserId && !isNaN(rawFilterUserId) ? rawFilterUserId : null;

  // Privacy gate: if the target company has blocked admin access, null out filterUserId
  // so ALL downstream route handlers that rely on ctx.filterUserId return nothing.
  let effectiveFilterUserId = resolvedFilterUserId;
  if (resolvedFilterUserId && user?.role === 'super_admin') {
    try {
      const { isPrivacyAccessAllowed } = await import('../db');
      const allowed = await isPrivacyAccessAllowed(user.id, resolvedFilterUserId);
      if (!allowed) {
        effectiveFilterUserId = null;
      }
    } catch {
      // On error, fail open (allow) so admin functionality isn't accidentally broken
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    filterUserId: effectiveFilterUserId ?? undefined,
  };
}
