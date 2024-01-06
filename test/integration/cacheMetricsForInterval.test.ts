import {MetricsManager} from "../../src";
import {getDataSource} from "../fixtures/getDataSource";
import {expect} from "chai";
import {cache} from "../fixtures/cache";
import MetricsCounterCache from "../../src/cache/MetricsCounterCache";
import {metrics} from "../fixtures/metrics";
import {MetricsCounterStore} from "../../src/lib/MetricsCounterStore";
import {CacheMetricsResult} from "../../src/lib/MetricsManager";
import {CacheInterval} from "../../src/types/types";

describe('MetricsManager', async () => {
  let metricsManager: MetricsManager;
  let counterCache: MetricsCounterCache;
  let counterStore: MetricsCounterStore;
  const metricName: string = 'sample';

  before(async () => {
    const dataSource = getDataSource();
    await dataSource.initialize();
    await dataSource.createQueryRunner().manager.query('DROP TABLE IF EXISTS metrics_counter;')

    metricsManager = new MetricsManager(
      dataSource,
      [metricName],
      CacheInterval.tenMin,
    );

    counterStore = metricsManager.metricsCounterStore;
    counterCache = metricsManager.counters[metricName];
    expect(!!cache).to.be.true;

    const result: boolean = await metricsManager.metricsCounterStore.deploy();
    expect(result).to.be.true;
  });

  describe('#integration - with fixtures', async () => {
    // load metrics
    before(async () => {
      metricsManager.counters[metricName]?.flushAll();

      cache.forEach(({ timestamp, id }) => {
        const result = counterCache.addRecord(timestamp, id);
        expect(result).to.eql(true);
        expect(counterCache.has(timestamp, id)).to.eql(true);
      });

      await Promise.allSettled(metrics.map((
        { metricName, interval, count, intervalEndTimestampMs}
      ) => counterStore.save(
        metricName,
        interval,
        count,
        parseInt(intervalEndTimestampMs),
      )));

      const count: number | undefined = await counterStore.countAll(metricName);
      expect(typeof(count) === 'number').to.be.true;
    });

    describe('cacheMetricsForInterval', async () => {
      it('should cache metrics for interval and save to store plus clean cache', async () => {
        const countIntervalBefore: number | undefined = await counterStore.get24HrCountFromIntervals(
          metricName,
          Date.now(),
        );

        expect(!!countIntervalBefore).to.be.true;
        expect(countIntervalBefore).to.eql(15903);

        const count24HrBefore: number | undefined = await counterStore.getLatest24HrCount(metricName);
        expect(!!count24HrBefore).to.be.true;
        expect(count24HrBefore).to.eql(29523);

        const countResult: CacheMetricsResult = await metricsManager.cacheMetricsForInterval(
          metricName,
          Date.now(),
          true,
          true,
          true,
        );

        expect(!!countResult).to.be.true;

        if(countResult) {
          const {
            success,
            metricsCountForInterval,
            wasIntervalRecordCreated,
            was24HrRecordCreated,
            metricsCountFor24Hr,
          } = countResult;

          expect(success).to.eql(true);
          expect(metricsCountForInterval).to.eql(5);
          expect(wasIntervalRecordCreated).to.true;
          expect(was24HrRecordCreated).to.true;
          expect(metricsCountFor24Hr).to.eql(15903 + 5);
        } else {
          expect(false).to.be.true;
        }

        const countIntervalAfter: number | undefined = await counterStore.get24HrCountFromIntervals(
          metricName,
          Date.now(),
        );

        expect(!!countIntervalAfter).to.be.true;
        expect(countIntervalAfter).to.eql(15903 + 5);
        expect(counterCache.cache.keys().length).to.eql(0);

        const count24HrAfter: number | undefined = await counterStore.getLatest24HrCount(metricName);
        expect(!!count24HrAfter).to.be.true;
        expect(count24HrAfter).to.eql(15903 + 5);
      });
    });
  });
});
