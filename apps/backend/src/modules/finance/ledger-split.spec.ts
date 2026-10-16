import { splitDeliveryCharge } from './ledger-split';
import { reportWindow } from './report-window';

describe('splitDeliveryCharge', () => {
  it('splits an even charge 75/25', () => {
    expect(splitDeliveryCharge(10000)).toEqual({
      driverBase: 7500,
      platformShare: 2500,
      bonus: 0,
      driverEarning: 7500,
    });
  });

  it('rounds the driver base and keeps the shares equal to the charge', () => {
    const split = splitDeliveryCharge(10);
    expect(split.driverBase + split.platformShare).toBe(10);
    expect(split.driverBase).toBe(8);
  });

  it('adds a flat bonus on top of the driver base', () => {
    expect(splitDeliveryCharge(10000, 500).driverEarning).toBe(8000);
    expect(splitDeliveryCharge(10000, 500).platformShare).toBe(2500);
  });
});

describe('reportWindow', () => {
  it('uses the Damascus calendar day', () => {
    const window = reportWindow('day', new Date('2026-10-13T21:30:00.000Z'));
    expect(window.from.toISOString()).toBe('2026-10-13T21:00:00.000Z');
    expect(window.to.toISOString()).toBe('2026-10-14T21:00:00.000Z');
  });

  it('starts the week on Monday in Damascus', () => {
    const window = reportWindow('week', new Date('2026-10-14T12:00:00.000Z'));
    expect(window.from.toISOString()).toBe('2026-10-11T21:00:00.000Z');
  });
});
