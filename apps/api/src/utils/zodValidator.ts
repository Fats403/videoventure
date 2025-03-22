import { Context, MiddlewareHandler, Next } from "hono";
import { ZodSchema, z } from "zod";
import { HTTPException } from "hono/http-exception";

// Create a type to store validated data with a specific schema
type ValidatedData<T> = {
  data: T;
};

// Create a type-safe middleware that preserves the schema type
export const zodValidator = <T extends ZodSchema>(
  location: "json" | "query" | "param",
  schema: T
): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;

      // Extract data from the appropriate location
      if (location === "json") {
        data = await c.req.json().catch(() => ({}));
      } else if (location === "query") {
        data = c.req.query();
      } else if (location === "param") {
        data = c.req.param();
      } else {
        throw new Error(`Unsupported validation location: ${location}`);
      }

      // Validate with Zod
      const result = schema.safeParse(data);

      if (!result.success) {
        throw new HTTPException(400, {
          message: "Validation error",
          cause: result.error,
        });
      }

      // Use TypeScript generics to preserve the type
      type ValidType = z.infer<T>;

      // Store validated data in the context
      c.set("validatedBody", result.data as ValidType);

      await next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(400, {
        message: "Invalid request",
        cause: error,
      });
    }
  };
};

// Type-safe accessor function with generics
export function getValidatedData<T>(c: Context): T {
  return c.get("validatedBody") as T;
}
