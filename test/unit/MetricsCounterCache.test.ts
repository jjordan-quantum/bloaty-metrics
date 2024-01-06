import MetricsCounterCache from "../../src/cache/MetricsCounterCache";
import {cache} from "../fixtures/cache";
import {expect} from "chai";

describe('MetricsCounterCache', async () => {
  let metricsCounterCache: MetricsCounterCache;
  const metricName: string = 'sample';

  before(async () => {
    metricsCounterCache = new MetricsCounterCache(metricName);
  });

  describe('addRecord', async () => {
    cache.forEach(({ timestamp, id }) => {
      it(`should add the record to cache`, async () => {
        const result = metricsCounterCache.addRecord(timestamp, id);
        expect(result).to.eql(true);
        expect(metricsCounterCache.has(timestamp, id)).to.eql(true);
      });
    })
  });

  describe('getAllKeysForInterval', async () => {
    it(`should return 5 keys for the interval`, async () => {
      const keys: string[] | undefined = metricsCounterCache.getAllKeysForInterval(10 * 60 * 1000, Date.now());
      expect(!!keys).to.eql(true);

      if(!!keys) {
        expect(keys.length).to.eql(5);
      }
    });
  });

  describe('countMetricsForInterval', async () => {
    it(`should count 5 metrics for the interval`, async () => {
      const count: number | undefined = metricsCounterCache.countMetricsForInterval(10 * 60 * 1000, Date.now());
      expect(!!count).to.eql(true);

      if(!!count) {
        expect(count).to.eql(5);
      }
    });
  });

  describe('deleteAllMetricsOlderThanTimestamp', async () => {
    it(`should delete all (7) keys older than 10 min`, async () => {
      const count: number | undefined = metricsCounterCache
        .deleteAllMetricsOlderThanTimestamp(Date.now() - 10 * 60 * 1000);

      expect(!!count).to.eql(true);

      if(!!count) {
        expect(count).to.eql(7);
      }

     expect(metricsCounterCache.cache.keys().length).to.eql(5);
    });

    it(`should delete all keys`, async () => {
      const count: number | undefined = metricsCounterCache
        .deleteAllMetricsOlderThanTimestamp(Date.now());

      expect(!!count).to.eql(true);

      if(!!count) {
        expect(count).to.eql(5);
      }

      expect(metricsCounterCache.cache.keys().length).to.eql(0);
    });
  });
});