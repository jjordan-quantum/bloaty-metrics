import {getDataSource} from "../fixtures/getDataSource";
import {DataSource} from "typeorm";
import {MetricsManager} from "../../src";
import {CacheInterval} from "../../src/types/types";
import {getRandom} from "../../src/utils/getRandom";

// define names for the metrics counters you want to use
const customMetrics: string[] = [
  'requests',
  'inserts',
  'errors',
];

let totalRequestMetrics: number = 0;
let totalInsertMetrics: number = 0;
let totalErrorMetrics: number = 0;

(async () => {
  // create DataSource, if not already using typeorm in your project
  // this example works best if there is not a metrics_counter table already populated
  const dataSource: DataSource = getDataSource();
  await dataSource.initialize();

  // instantiate MetricsManager
  const  metricsManager: MetricsManager = new MetricsManager(
    dataSource,
    customMetrics,
    CacheInterval.oneMin,
  );

  // deploy schema for counters
  await metricsManager.metricsCounterStore.deploy();

  // start the scheduler which saves metrics to datastore, clearing cache on a cron schedule using the given interval
  metricsManager.start(async () => {
    const start = Date.now();
    console.log('==========================================');
    console.log(`Summary at ${start}ms`);

    console.log('==========================================');
    console.log(`Total request metrics counted: ${totalRequestMetrics}`);
    console.log(`Total insert metrics counted: ${totalInsertMetrics}`);
    console.log(`Total error metrics counted: ${totalErrorMetrics}`);
    console.log('==========================================');

    for(const metricName of customMetrics) {
      console.log(`Summary for ${metricName}`);

      // log metrics in cache -> this should be near empty after saving
      const totalMetricsInCache: number = metricsManager.counters[metricName].cache.keys().length;
      console.log(`metrics count in cache: ${totalMetricsInCache}`);

      // log metrics in latest interval
      const intervalCount: number | undefined = await metricsManager.metricsCounterStore.get24HrCountFromIntervals(
        metricName,
        start,
      );

      console.log(`metrics count in datastore: ${intervalCount}`);
    }

    console.log('==========================================');
  });

  // create some metrics
  setInterval(() => {
    const _requests = getRandom(10);
    const _inserts = getRandom(10);
    const _errors = getRandom(10);

    totalRequestMetrics += _requests;
    totalInsertMetrics += _inserts;
    totalErrorMetrics += _errors;

    console.log(`Counting ${_requests} request metrics`);
    console.log(`Counting ${_inserts} insert metrics`);
    console.log(`Counting ${_errors} error metrics`);

    for(let i = 0; i < _requests; i++) {
      metricsManager.countMetric('requests');
    }

    for(let i = 0; i < _inserts; i++) {
      metricsManager.countMetric('inserts');
    }

    for(let i = 0; i < _errors; i++) {
      metricsManager.countMetric('errors');
    }
  }, 10000);
})();
