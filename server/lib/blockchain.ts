import crypto from 'crypto';
import { getBlockCount, createBlock, getLatestBlock, getAllBlocks, getUserBlocks } from './db/blocks.js';

export function calculateHash(index: number, timestamp: string, from: string, to: string, payload: string, prevHash: string) {
  const data = `${index}${timestamp}${from}${to}${payload}${prevHash}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function initializeBlockchain() {
  const existingBlocks = await getBlockCount();
  
  if (existingBlocks === 0) {
    const timestamp = new Date().toISOString();
    const hash = calculateHash(0, timestamp, 'system', 'all', 'Genesis Block', '0');
    
    await createBlock({
      index: 0,
      timestamp,
      from: 'system',
      to: 'all',
      payload: 'Genesis Block',
      prevHash: '0',
      hash,
    });
    
    console.log('Genesis block created');
  }
}

export async function addMessageBlock(from: string, to: string, payload: string) {
  const prevBlock = await getLatestBlock();
  const index = prevBlock.index + 1;
  const timestamp = new Date().toISOString();
  const prevHash = prevBlock.hash;
  const hash = calculateHash(index, timestamp, from, to, payload, prevHash);

  const block = await createBlock({
    index,
    timestamp,
    from,
    to,
    payload,
    prevHash,
    hash,
  });

  return block;
}

export async function getBlockchain() {
  return await getAllBlocks();
}

export async function getUserBlockchain(username: string) {
  return await getUserBlocks(username);
}

export async function validateChain() {
  const chain = await getBlockchain();
  
  for (let i = 1; i < chain.length; i++) {
    const block = chain[i];
    const prev = chain[i - 1];
    
    if (block.prevHash !== prev.hash) {
      return { valid: false, error: `Block ${i} prevHash mismatch` };
    }
    
    const calculatedHash = calculateHash(
      block.index,
      block.timestamp,
      block.from,
      block.to,
      block.payload,
      block.prevHash
    );
    
    if (block.hash !== calculatedHash) {
      return { valid: false, error: `Block ${i} hash invalid` };
    }
  }
  
  return { valid: true };
}
