import { createMiddleware } from "hono/factory";

// Create a properly typed authentication middleware
export const authenticateUser = createMiddleware<{
  Variables: {
    userId: string;
  };
}>(async (c, next) => {
  try {
    // Your authentication logic here
    // For example:
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // Verify token and get userId
    const userId = "verified-user-id"; // Replace with actual verification logic

    // Set the userId in the context variables
    c.set("userId", userId);

    await next();
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
});
