  import env from "@configs/env";
import { PrismaClient } from "@db";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prismaClientSingleton = () => {
  const dbPath = env.databaseUrl.replace("file:", "");
  
  // ✅ BetterSQLite3 adapter with busy timeout to prevent hanging
  const adapter = new PrismaBetterSqlite3({
    url: dbPath,
    // Use database options through constructor params
  });

  return new PrismaClient({
    adapter,
    log: env.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const models = globalForPrisma.prisma ?? prismaClientSingleton();

export default models;

if (env.nodeEnv !== "production") globalForPrisma.prisma = models;

export * from "./enums";
