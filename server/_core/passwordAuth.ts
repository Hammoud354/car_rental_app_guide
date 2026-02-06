import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";

const SALT_ROUNDS = 10;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this"
);

export interface RegisterInput {
  username: string;
  password: string;
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(userId: number, username: string): Promise<string> {
  const token = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token expires in 7 days
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: number; username: string };
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user with username and password
 */
export async function registerUser(input: RegisterInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert username to lowercase for case-insensitive comparison
  const usernameLower = input.username.toLowerCase();

  // Check if username already exists (case-insensitive)
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, usernameLower))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Username already exists");
  }

  // Check if email already exists (if provided)
  if (input.email) {
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new Error("Email already exists");
    }
  }

  // Hash the password
  const hashedPassword = await hashPassword(input.password);

  // Create the user
  const [newUser] = await db.insert(users).values({
    username: usernameLower,
    password: hashedPassword,
    name: input.name,
    email: input.email,
    phone: input.phone,
    countryCode: input.countryCode,
    country: input.country,
    loginMethod: "password",
    role: "user",
    lastSignedIn: new Date(),
  });

  // Generate token
  const token = await generateToken(newUser.insertId, usernameLower);

  return {
    user: {
      id: newUser.insertId,
      username: usernameLower,
      name: input.name,
      email: input.email,
      role: "user",
    },
    token,
  };
}

/**
 * Login a user with username and password
 */
export async function loginUser(input: LoginInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert username to lowercase for case-insensitive comparison
  const usernameLower = input.username.toLowerCase();

  // Find user by username (case-insensitive)
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, usernameLower))
    .limit(1);

  if (!user) {
    throw new Error("Invalid username or password");
  }

  // Check if user has a password (might be OAuth-only user)
  if (!user.password) {
    throw new Error("This account uses OAuth login. Please use the OAuth login button.");
  }

  // Verify password
  const isValidPassword = await comparePassword(input.password, user.password);

  if (!isValidPassword) {
    throw new Error("Invalid username or password");
  }

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  // Generate token
  const token = await generateToken(user.id, user.username);

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
}
