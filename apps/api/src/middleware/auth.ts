import { createMiddleware } from "hono/factory";
import { auth } from "firebase-admin";

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

    // Verify the Firebase ID token
    // const decodedToken = await auth().verifyIdToken(token);

    // Get the user ID from the decoded token
    // const userId = decodedToken.uid;

    // Set the userId in the context variables
    c.set("userId", token);

    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Authentication failed" }, 401);
  }
});
