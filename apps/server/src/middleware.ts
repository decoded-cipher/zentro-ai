
import { Context, Next } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { nanoid } from "nanoid";
import { db } from "db";
import { user } from "db";
import { eq } from "drizzle-orm";


export const clerkAuthMiddleware = clerkMiddleware();

export async function authMiddleware(c: Context, next: Next) {
  try {
    const auth = getAuth(c);
    
    if (!auth || !auth.userId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const clerkUserId = auth.userId;
    
    const email = auth.sessionClaims?.email as string | undefined;
    if (!email) {
      return c.json({ message: "Email not found" }, 404);
    }

    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.clerk_id, clerkUserId))
      .limit(1);

    let dbUserId: string;

    if (existingUser.length > 0) {
      dbUserId = existingUser[0].id;
    } else {
      dbUserId = nanoid();
      
      const newUser = {
        id: dbUserId,
        email,
        clerk_id: clerkUserId
      };

      await db.insert(user).values(newUser);
    }

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
