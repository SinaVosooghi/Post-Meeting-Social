/**
 * Simple in-memory token store for demo purposes
 * In production, use a proper database like Redis or PostgreSQL
 */

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

// In-memory store (resets on server restart)
const tokenStore = new Map<string, StoredToken>();

export function storeLinkedInToken(userEmail: string, tokenData: StoredToken) {
  tokenStore.set(userEmail, tokenData);
}

export function getLinkedInToken(userEmail: string): StoredToken | null {
  return tokenStore.get(userEmail) || null;
}

export function removeLinkedInToken(userEmail: string) {
  tokenStore.delete(userEmail);
}

export function isLinkedInTokenValid(token: StoredToken): boolean {
  return token.expiresAt > Date.now();
}
