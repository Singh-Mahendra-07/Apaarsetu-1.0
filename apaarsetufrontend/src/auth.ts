/**
 * Deprecated NextAuth integration stub.
 * APAARSetu uses central Spring Boot JWT authentication managed via src/lib/auth-context.tsx
 * and src/lib/api/auth-api.ts (APAAR-SEC-005).
 * Direct Mongoose database connections from the frontend process are removed.
 */

export const handlers = {
  GET: async () => new Response("Not Found", { status: 404 }),
  POST: async () => new Response("Not Found", { status: 404 }),
};

export const auth = async () => null;
export const signIn = async () => {
  throw new Error("Use useAuth().login from auth-context.tsx");
};
export const signOut = async () => {
  throw new Error("Use useAuth().logout from auth-context.tsx");
};
