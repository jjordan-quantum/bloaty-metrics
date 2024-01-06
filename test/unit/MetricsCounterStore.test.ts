import {MetricsCounterStore} from "../../src/lib/MetricsCounterStore";
import {getDataSource} from "../fixtures/getDataSource";
import {expect} from "chai";
import {metrics} from "../fixtures/metrics";
import 'reflect-metadata';
import {MetricsCounter} from "../../src/entitiy/MetricsCounter";

describe('MetricsCounterStore', async () => {
  let metricsCounterStore: MetricsCounterStore;
  const metricName: string = 'sample';

  before(async () => {
    const dataSource = getDataSource();
    await dataSource.initialize();
    await dataSource.createQueryRunner().manager.query('DROP TABLE IF EXISTS metrics_counter;')
    metricsCounterStore = new MetricsCounterStore(dataSource);
  });

  describe(`deploy`, async () => {
    it(`should create the schema using the given postgres connection`, async () => {
      const result: boolean = await metricsCounterStore.deploy();
      expect(result).to.be.true;
    });
  });

  describe('save', async () => {
    metrics.forEach(({ metricName, interval, count, intervalEndTimestampMs}) => {
      it('should save the metrics', async () => {
        const result: boolean = await metricsCounterStore.save(
          metricName,
          interval,
          count,
          parseInt(intervalEndTimestampMs),
        );

        expect(result).to.be.true;
      });
    });
  });

  describe('countAll', async () => {
    it('should count 23 total records for the metric name', async () => {
      const count: number | undefined = await metricsCounterStore.countAll(metricName);
      expect(typeof(count) === 'number').to.be.true;

      if(typeof(count) === 'number') {
        expect(count).to.eql(23);
      }
    });

    it('should count 2 x 24 hr records for the metric name', async () => {
      const count: number | undefined = await metricsCounterStore.countAll(metricName, true);
      expect(typeof(count) === 'number').to.be.true;

      if(typeof(count) === 'number') {
        expect(count).to.eql(2);
      }
    });

    it('should count 21 x interval records for the metric name', async () => {
      const count: number | undefined = await metricsCounterStore.countAll(metricName, false);
      expect(typeof(count) === 'number').to.be.true;
      expect(count).to.eql(21);
    });
  });

  describe('getLatest24HrRecord', async () => {
    it(`should return the latest 24 hr record with count 29523`, async () => {
      const record: MetricsCounter | undefined = await metricsCounterStore.getLatest24HrRecord(metricName);
      expect(!!record).to.be.true;

      if(!!record) {
        expect(record.count).to.eql(29523);
      }
    });
  });

  describe('getLatest24HrCount', async () => {
    it(`should return a count of 29523 for the latest 24 hr record`, async () => {
      const count: number | undefined = await metricsCounterStore.getLatest24HrCount(metricName);
      expect(!!count).to.be.true;
      expect(count).to.eql(29523);
    });
  });

  describe('get24HrCountFromIntervals', async () => {
    it('should count 15903 metrics for non-24 hr interval records for the given metric for last 24 hrs', async () => {
      const count: number | undefined = await metricsCounterStore.get24HrCountFromIntervals(
        metricName,
        Date.now(),
      );

      expect(!!count).to.be.true;
      expect(count).to.eql(15903);
    });
  });

  describe('cleanup24Hr', async () => {
    it('should delete all but 1 24 hour record', async () => {
      const deleted: number | undefined = await metricsCounterStore.cleanup24Hr(metricName);
      expect(typeof(deleted) === 'number').to.be.true;
      expect(deleted).to.eql(1);

      const count: number | undefined = await metricsCounterStore.countAll(metricName, true);
      expect(typeof(count) === 'number').to.be.true;
      expect(count).to.eql(1);
    });
  });

  describe('cleanupInterval', async () => {
    it('should delete all interval records', async () => {
      const deleted: number | undefined = await metricsCounterStore.cleanupInterval(metricName, Date.now());
      expect(typeof(deleted) === 'number').to.be.true;
      expect(deleted).to.eql(21);

      const count: number | undefined = await metricsCounterStore.countAll(metricName, false);
      expect(typeof(count) === 'number').to.be.true;
      expect(count).to.eql(0);
    });
  });
});
