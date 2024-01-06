import {MetricsManager} from "../../src";
import {getDataSource} from "../fixtures/getDataSource";
import {expect} from "chai";
import {TEN_MINUTE_MS, TWENTY_FOUR_HOUR_MS} from "../../src/utils/constants";
import {cache} from "../fixtures/cache";
import MetricsCounterCache from "../../src/cache/MetricsCounterCache";
import {metrics} from "../fixtures/metrics";
import {MetricsCounterStore} from "../../src/lib/MetricsCounterStore";
import {CountResult} from "../../src/lib/MetricsManager";
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

  describe('countMetric', async () => {
    it('should count all metrics and add to cache', async () => {

      await Promise.allSettled([...Array(23)]
        .map((_, i) => i*i)
        .map(_i => metricsManager.countMetric(metricName)))

      expect(metricsManager.counters[metricName]?.cache.keys().length).to.eql(23);
    });
  });

  describe('countMetricSync', async () => {
    it('should count all metrics and add to cache', async () => {
      for(let i = 0; i < 23; i++) {
        metricsManager.countMetricSync(metricName);
      }

      expect(metricsManager.counters[metricName]?.cache.keys().length).to.eql(46);
    });
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

   describe('getCountForInterval', async () => {
     it('should get count for interval without saving or cleaning cache', async () => {
       const countBefore: number | undefined = await counterStore.get24HrCountFromIntervals(
         metricName,
         Date.now(),
       );

       expect(!!countBefore).to.be.true;
       expect(countBefore).to.eql(15903);

       const countResult: CountResult | undefined = await metricsManager.getCountForInterval(
         metricName,
         Date.now(),
         false,
         false,
       );

       expect(!!countResult).to.be.true;

       if(countResult) {
         const {
           count,
           interval,
         } = countResult;

         expect(interval).to.eql(TEN_MINUTE_MS);
         expect(count).to.eql(5);
       } else {
         expect(false).to.be.true;
       }

       const countAfter: number | undefined = await counterStore.get24HrCountFromIntervals(
         metricName,
         Date.now(),
       );

       expect(!!countAfter).to.be.true;
       expect(countAfter).to.eql(countBefore);
     });

     it('should get count for interval and save to store plus clean cache', async () => {
       const countBefore: number | undefined = await counterStore.get24HrCountFromIntervals(
         metricName,
         Date.now(),
       );

       expect(!!countBefore).to.be.true;
       expect(countBefore).to.eql(15903);

       const countResult: CountResult | undefined = await metricsManager.getCountForInterval(
         metricName,
         Date.now(),
         true,
         true,
       );

       expect(!!countResult).to.be.true;

       if(countResult) {
         const {
           count,
           interval,
         } = countResult;

         expect(interval).to.eql(TEN_MINUTE_MS);
         expect(count).to.eql(5);
       } else {
         expect(false).to.be.true;
       }

       const countAfter: number | undefined = await counterStore.get24HrCountFromIntervals(
         metricName,
         Date.now(),
       );

       expect(!!countAfter).to.be.true;
       expect(countAfter).to.eql(15903 + 5);
       expect(counterCache.cache.keys().length).to.eql(0);
     });
   });

   describe('getCountForLast24Hr', async () => {
     it('should get count for last 24 hr without saving', async () => {
       const countBefore: number | undefined = await counterStore.getLatest24HrCount(metricName);
       expect(!!countBefore).to.be.true;
       expect(countBefore).to.eql(29523);

       const countResult: CountResult | undefined = await metricsManager.getCountForLast24Hr(
         metricName,
         Date.now(),
         false,
       );

       expect(!!countResult).to.be.true;

       if(countResult) {
         const {
           count,
           interval,
         } = countResult;

         expect(interval).to.eql(TWENTY_FOUR_HOUR_MS);
         expect(count).to.eql(15903 + 5);
       } else {
         expect(false).to.be.true;
       }

       const countAfter: number | undefined = await counterStore.getLatest24HrCount(metricName);
       expect(!!countAfter).to.be.true;
       expect(countAfter).to.eql(countBefore);
     });

     it('should get count for last 24 hr and save to store', async () => {
       const countBefore: number | undefined = await counterStore.getLatest24HrCount(metricName);
       expect(!!countBefore).to.be.true;
       expect(countBefore).to.eql(29523);

       const countResult: CountResult | undefined = await metricsManager.getCountForLast24Hr(
         metricName,
         Date.now(),
         true,
       );

       expect(!!countResult).to.be.true;

       if(countResult) {
         const {
           count,
           interval,
         } = countResult;

         expect(interval).to.eql(TWENTY_FOUR_HOUR_MS);
         expect(count).to.eql(15903 + 5);
       } else {
         expect(false).to.be.true;
       }

       const countAfter: number | undefined = await counterStore.getLatest24HrCount(metricName);
       expect(!!countAfter).to.be.true;
       expect(countAfter).to.eql(15903 + 5);
     });
   });
  });
});
