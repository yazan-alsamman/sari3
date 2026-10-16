import {
  canTakeOffer,
  classifyLocation,
  haversineMeters,
  shouldStoreSample,
} from './freshness';

describe('freshness', () => {
  const receivedAt = new Date('2026-10-13T10:00:00.000Z');

  function at(msAgo: number): Date {
    return new Date(receivedAt.getTime() - msAgo);
  }

  it('marks a recent tight fix fresh', () => {
    expect(
      classifyLocation({ capturedAt: at(10_000), receivedAt, accuracyMeters: 20 }),
    ).toBe('fresh');
  });

  it('marks a recent loose fix aging', () => {
    expect(
      classifyLocation({ capturedAt: at(10_000), receivedAt, accuracyMeters: 50 }),
    ).toBe('aging');
  });

  it('marks an old tight fix stale', () => {
    expect(
      classifyLocation({ capturedAt: at(50_000), receivedAt, accuracyMeters: 10 }),
    ).toBe('stale');
  });

  it('marks a bad accuracy stale', () => {
    expect(
      classifyLocation({ capturedAt: at(1_000), receivedAt, accuracyMeters: 120 }),
    ).toBe('stale');
  });

  it('stores a sample after 5 seconds even if the driver has not moved', () => {
    const previous = { capturedAt: at(6_000), lat: 33.5, lng: 36.3 };
    expect(
      shouldStoreSample(previous, { capturedAt: at(0), lat: 33.5, lng: 36.3 }),
    ).toBe(true);
  });

  it('skips a sample that is too soon and too close', () => {
    const previous = { capturedAt: at(1_000), lat: 33.5, lng: 36.3 };
    expect(
      shouldStoreSample(previous, { capturedAt: at(0), lat: 33.5, lng: 36.3 }),
    ).toBe(false);
  });

  it('measures a short city hop in meters', () => {
    const meters = haversineMeters(
      { lat: 33.5138, lng: 36.2765 },
      { lat: 33.52, lng: 36.28 },
    );
    expect(meters).toBeGreaterThan(500);
    expect(meters).toBeLessThan(1500);
  });

  it('blocks a second offer while the first trip is still in transit', () => {
    expect(canTakeOffer([])).toBe(true);
    expect(canTakeOffer(['DELIVERED'])).toBe(true);
    expect(canTakeOffer(['IN_TRANSIT'])).toBe(false);
    expect(canTakeOffer(['DELIVERED', 'DRIVER_ACCEPTED'])).toBe(false);
  });
});