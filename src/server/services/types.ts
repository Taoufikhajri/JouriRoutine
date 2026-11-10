import type { Prisma, PrismaClient } from "@prisma/client";

/** Services accept either the client or an interactive transaction. */
export type DB = PrismaClient | Prisma.TransactionClient;
