import { Context, Next } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { nanoid } from "nanoid";
import { db } from "db";
import { user } from "db";
import { eq } from "drizzle-orm";

// Clerk auth middleware - verifies token and provides user info
export const clerkAuthMiddleware = clerkMiddleware();

// Custom middleware to sync user with database
export async function authMiddleware(c: Context, next: Next) {
  try {
    // Get authenticated user from @hono/clerk-auth
    const auth = getAuth(c);
    
    if (!auth || !auth.userId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const clerkUserId = auth.userId;
    
    // Get user information from auth object
    const email = auth.sessionClaims?.email as string | undefined;

    if (!email) {
      return c.json({ message: "Email not found" }, 404);
    }

    // Check if user exists in database by clerk_id
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.clerk_id, clerkUserId))
      .limit(1);

    let dbUserId: string;

    if (existingUser.length > 0) {
      // User exists, use their database ID
      dbUserId = existingUser[0].id;
    } else {
      // User doesn't exist, create a new user in database
      dbUserId = `user_${nanoid()}`;
      
      const newUser = {
        id: dbUserId,
        email,
        clerk_id: clerkUserId
      };

      await db.insert(user).values(newUser);
    }

    // Set the database user ID (not Clerk ID) in context
    c.set("userId", dbUserId);
    c.set("clerkUserId", clerkUserId);
    c.set("user", { email, id: dbUserId });
    await next();

  } catch (error) {
    return c.json({
      message: "Unauthorized", 
      error: (error as Error).message
    }, 401);
  }
}
