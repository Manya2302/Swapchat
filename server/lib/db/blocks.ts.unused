import { db } from '../../db.js';
import { blocks } from '../../../shared/schema.js';
import { eq, or, desc, asc, sql } from 'drizzle-orm';
import { encryptField, decryptField } from '../encryption.js';

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
  const [block] = await db.insert(blocks).values({
    ...blockData,
    from: encryptField(blockData.from),
    to: encryptField(blockData.to),
    payload: encryptField(blockData.payload),
  }).returning();
  
  return decryptBlockFields(block);
}

function decryptBlockFields(block: any) {
  if (!block) return null;
  return {
    ...block,
    from: decryptField(block.from) || block.from,
    to: decryptField(block.to) || block.to,
    payload: decryptField(block.payload) || block.payload,
  };
}

export async function getLatestBlock() {
  const [block] = await db.select().from(blocks).orderBy(desc(blocks.index)).limit(1);
  return decryptBlockFields(block);
}

export async function getAllBlocks() {
  const allBlocks = await db.select().from(blocks).orderBy(asc(blocks.index));
  return allBlocks.map(decryptBlockFields);
}

export async function getUserBlocks(username: string) {
  const allBlocks = await db.select().from(blocks).orderBy(asc(blocks.index));
  
  return allBlocks
    .map(decryptBlockFields)
    .filter(block => 
      block.from === username || 
      block.to === username || 
      block.from === 'system'
    );
}
