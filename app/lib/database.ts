import { env } from 'cloudflare:workers';
export function database(): D1Database {
  if (!env.DB) throw new Error('Student progress is temporarily unavailable. Please try again shortly.');
  return env.DB;
}
export function classroomConfig() {
  const bindings = env as unknown as Record<string,string>;
  return { instructorEmail: bindings.INSTRUCTOR_EMAIL?.toLowerCase(), joinCode: bindings.CLASS_JOIN_CODE };
}
