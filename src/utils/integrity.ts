const SALT = "code-trek-integrity-v1";

export function computeChecksum(payload: string): string {
  const input = payload + SALT;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function verifyChecksum(payload: string, expectedChecksum: string): boolean {
  return computeChecksum(payload) === expectedChecksum;
}
