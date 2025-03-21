import { Context, MiddlewareHandler, Next } from "hono";
import { z } from "zod";

/**
 * Creates a middleware that validates request parameters against a Zod schema
 * @param schema The Zod schema to validate against
 * @param target Which part of the request to validate ('params', 'query', 'json', 'form')
 * @returns A middleware handler that validates the request
 */
export const validate = <T extends z.ZodType>(
  schema: T,
  target: "params" | "query" | "json" | "form" = "params"
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;

      // Extract data based on target
      switch (target) {
        case "params":
          data = c.req.param();
          break;
        case "query":
          data = c.req.query();
          break;
        case "json":
          data = await c.req.json().catch(() => ({}));
          break;
        case "form":
          data = await c.req.parseBody().catch(() => ({}));
          break;
      }

      // Validate with Zod schema
      const result = schema.safeParse(data);

      if (!result.success) {
        // Format Zod errors into a more readable structure
        const formattedErrors = result.error.format();
        return c.json(
          {
            success: false,
            error: "Validation failed",
            details: formattedErrors,
          },
          400
        );
      }

      // If validation passes, continue to the next middleware/handler
      await next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      return c.json(
        { success: false, error: "Validation error occurred" },
        500
      );
    }
  };
};
