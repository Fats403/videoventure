import { createMiddleware } from "hono/factory";

// Create a properly typed authentication middleware
export const authenticateUser = createMiddleware<{
  Variables: {
    userId: string;
  };
}>(async (c, next) => {
  try {
    // Get the token from the Authorization header
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // TODO: Add clerk auth here

    c.set("userId", token);

    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
});
