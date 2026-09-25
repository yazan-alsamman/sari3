import { PrismaHealthIndicator } from './prisma.health';

describe('PrismaHealthIndicator', () => {
  it('returns up when prisma is healthy', async () => {
    const prisma = { isHealthy: async () => true };
    const indicator = new PrismaHealthIndicator(prisma as never);
    const result = await indicator.isHealthy('postgres');
    expect(result.postgres.status).toBe('up');
  });
});
