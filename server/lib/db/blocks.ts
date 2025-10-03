import { db } from '../../db.js';
import { blocks } from '../../../shared/schema.js';
import { eq, or, desc, asc, sql } from 'drizzle-orm';

export async function getBlockCount() {
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(blocks);
  return result[0]?.count || 0;
}

export async function createBlock(blockData: {
  index: number;
  timestamp: string;
  from: string;
  to: string;
  payload: string;
  prevHash: string;
  hash: string;
}) {
  const [block] = await db.insert(blocks).values(blockData).returning();
  return block;
}

export async function getLatestBlock() {
  const [block] = await db.select().from(blocks).orderBy(desc(blocks.index)).limit(1);
  return block;
}

export async function getAllBlocks() {
  return await db.select().from(blocks).orderBy(asc(blocks.index));
}

export async function getUserBlocks(username: string) {
  return await db.select().from(blocks)
    .where(
      or(
        eq(blocks.from, username),
        eq(blocks.to, username),
        eq(blocks.from, 'system')
      )
    )
    .orderBy(asc(blocks.index));
}
