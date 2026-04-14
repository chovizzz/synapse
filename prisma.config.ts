import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// Next.js uses .env.local; load it explicitly for Prisma CLI
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // fallback to .env

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["POSTGRES_PRISMA_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
});
