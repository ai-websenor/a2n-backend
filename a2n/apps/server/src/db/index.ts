import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;



const sql = neon(process.env.DATABASE_URL || "");
export const db = drizzle(sql, { schema });

export * from "./schema";
