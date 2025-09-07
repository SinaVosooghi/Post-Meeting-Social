/**
 * Persistent token store using file system
 * For demo purposes - in production use a proper database
 */

import { promises as fs } from 'fs';
import path from 'path';

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: {
    id: string;
    name: string;
    email: string;
  };
}

const TOKEN_FILE = path.join(process.cwd(), 'data', 'linkedin-tokens.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(TOKEN_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Load tokens from file
async function loadTokens(): Promise<Record<string, StoredToken>> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Save tokens to file
async function saveTokens(tokens: Record<string, StoredToken>) {
  try {
    await ensureDataDir();
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Failed to save tokens:', error);
  }
}

export async function storeLinkedInToken(userEmail: string, tokenData: StoredToken) {
  const tokens = await loadTokens();
  tokens[userEmail] = tokenData;
  await saveTokens(tokens);
}

export async function getLinkedInToken(userEmail: string): Promise<StoredToken | null> {
  const tokens = await loadTokens();
  return tokens[userEmail] || null;
}

export async function removeLinkedInToken(userEmail: string) {
  const tokens = await loadTokens();
  delete tokens[userEmail];
  await saveTokens(tokens);
}

export function isLinkedInTokenValid(token: StoredToken): boolean {
  return token.expiresAt > Date.now();
}
