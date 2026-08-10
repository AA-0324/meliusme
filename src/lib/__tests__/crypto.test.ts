import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted, getEncryptionKey } from '@/lib/crypto';

describe('crypto', () => {
  it('round-trips a plain string', async () => {
    const cipher = await encrypt('hello meliusme');
    expect(cipher).not.toContain('hello');
    expect(await decrypt(cipher)).toBe('hello meliusme');
  });

  it('round-trips unicode and large payloads without stack overflow', async () => {
    const payload = 'ünïcødé — ' + 'x'.repeat(200_000);
    expect(await decrypt(await encrypt(payload))).toBe(payload);
  });

  it('produces a different blob for the same plaintext (random IV)', async () => {
    const a = await encrypt('same');
    const b = await encrypt('same');
    expect(a).not.toBe(b);
    expect(await decrypt(a)).toBe(await decrypt(b));
  });

  it('reuses one persisted key across calls', async () => {
    const first = await getEncryptionKey();
    const second = await getEncryptionKey();
    expect(first).toBe(second);
  });

  it('rejects malformed or tampered blobs instead of returning garbage', async () => {
    await expect(decrypt('not-base64!!')).rejects.toBeTruthy();
    const cipher = await encrypt('secret value');
    const tampered = cipher.slice(0, -6) + (cipher.endsWith('A') ? 'BBBBBB' : 'AAAAAA');
    await expect(decrypt(tampered)).rejects.toBeTruthy();
  });

  it('detects encrypted blobs and ignores plain JSON', async () => {
    expect(isEncrypted(await encrypt('a reasonably long plaintext'))).toBe(true);
    expect(isEncrypted('{"calories":100}')).toBe(false);
    expect(isEncrypted('[1,2,3]')).toBe(false);
    expect(isEncrypted('short')).toBe(false);
  });
});
