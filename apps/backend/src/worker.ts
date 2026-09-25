/**
 * Worker entrypoint (ADR-001 Option B).
 * Phase 1: process boots and stays alive; BullMQ processors arrive with jobs domain.
 */
async function bootstrapWorker() {
  // eslint-disable-next-line no-console
  console.log(
    'sareee-worker Phase 1 stub online — queue processors land in later phases',
  );
  // Keep process alive for container health in early deploys.
  setInterval(() => undefined, 60_000);
}

void bootstrapWorker();
