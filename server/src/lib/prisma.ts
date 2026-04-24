import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Force load the .env from the current directory and override any existing environment variables
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

import { getUserId } from './cls'


const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  allowExitOnIdle: false,
})

const adapter = new PrismaPg(pool)
export const basePrisma = new PrismaClient({ adapter })

// Extend the Prisma client to implement Row-Level Security (RLS)
export const prisma = basePrisma.$extends({
  query: {
    // This hook handles all model-based operations (e.g., prisma.users.findUnique)
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const userId = getUserId();
        
        // If no user ID is present in the context (unauthenticated or system task),
        // we just execute the query as is.
        if (!userId) {
          return query(args);
        }

        // For RLS to work, we must set the session variable in the SAME transaction/connection
        // as the actual query. We wrap the operation in a transaction.
        return basePrisma.$transaction(async (tx) => {
          // Set the session variable for the current transaction
          // Using a parameterized query for safety
          await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
          
          // Execute the actual model operation on the transaction client
          return (tx as any)[model][operation](args);
        });
      }
    },
    // This hook handles raw database queries (e.g., prisma.$queryRaw)
    async $queryRaw({ args, query }) {
      const userId = getUserId();
      if (!userId) {
        return query(args);
      }

      return basePrisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
        return tx.$queryRaw(args as any);
      });
    },
    // This hook handles raw database executions (e.g., prisma.$executeRaw)
    async $executeRaw({ args, query }) {
      const userId = getUserId();
      if (!userId) {
        return query(args);
      }

      return basePrisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
        return tx.$executeRaw(args as any);
      });
    }
  }
})
