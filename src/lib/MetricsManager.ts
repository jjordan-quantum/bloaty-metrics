import {DataSource} from "typeorm";
import {ILogger} from "../interfaces";
import Logger from "./Logger";
import Component from "./Component";
import {MetricsCounterStore} from "./MetricsCounterStore";
import MetricsCounterCache from "../cache/MetricsCounterCache";
import {TWENTY_FOUR_HOUR_MS} from "../utils/constants";
import {CacheInterval} from "../types/types";
import {getCronSchedule} from "../utils/getCronSchedule";
const cron = require('node-cron');

export type CountResult = {
  count: number;
  interval: number;
  metricName: string;
}

export type CacheMetricsResult = {
  success: boolean;
  message?: string;
  error?: Error;

  metricName: string;

  metricsCountForInterval?: number;
  wasIntervalRecordCreated?: boolean;
  was24HrRecordCreated?: boolean;
  metricsCountFor24Hr?: number;
}

export class MetricsManager extends Component {
  dataSource!: DataSource;
  metricsCounterStore!: MetricsCounterStore;
  interval!: number;
  counters: {[key: string]: MetricsCounterCache} = {};

  constructor(
    dataSource: DataSource,
    keys: string[],
    cacheInterval: CacheInterval,
    logger?: ILogger,
  ) {
    super(logger || (new Logger()));
    this.dataSource = dataSource;
    this.interval = cacheInterval

    this.metricsCounterStore = new MetricsCounterStore(
      dataSource,
      this.logger,
    );

    for(const key of keys) {
      this.counters[key] = new MetricsCounterCache(key, this.logger);
    }
  }

  start(logMetricsCallBack?: Function): any {
    return cron.schedule(getCronSchedule(this.interval), async () => {
      const now = Date.now();

      try {
        await Promise.allSettled(Object.keys(this.counters).map(key => this.cacheMetricsForInterval(
          key,
          now, // ?
          true,
          true,
          true,
        )));

        if(logMetricsCallBack) {
          logMetricsCallBack();
        }
      } catch(e: any) {
        this.error(`Error while executing scheduled metrics caching @ ${now}ms`, e);
      }
    });
  }

  countMetricSync(metricName: string): void {
    if(this.counters.hasOwnProperty(metricName)) {
      this.counters[metricName].addRecord();
    } else {
      this.error(`Counter not found for key ${metricName}`);
    }
  }

  async countMetric(metricName: string): Promise<void> {
    this.countMetricSync(metricName);
  }

  async cacheMetricsForInterval(
    metricName: string,
    timestamp: number,
    saveIntervalCountToDataStore: boolean,
    cleanCache: boolean,
    save24HrCountToDataStore: boolean,
  ): Promise<CacheMetricsResult> {
    try {
      const countResult: CountResult | undefined = await this.getCountForInterval(
        metricName,
        Date.now(),
        saveIntervalCountToDataStore,
        cleanCache,
      );

      if(!countResult) {
        this.error('Failed to count metrics in cache');

        return {
          success: false,
          message: 'Failed to count metrics in cache',
          metricName,
        }
      }

      const countResult24Hr: CountResult | undefined = await this.getCountForLast24Hr(
        metricName,
        Date.now(),
        true,
      );

      if(!countResult24Hr) {
        this.error('Failed to count 24 hr metrics in datastore');
      }

      return {
        success: !!countResult24Hr,
        message: !!countResult24Hr ? undefined : 'failed to count 24 hr metrics in datastore',
        metricName,

        metricsCountForInterval: countResult.count,
        wasIntervalRecordCreated: saveIntervalCountToDataStore,
        was24HrRecordCreated: save24HrCountToDataStore && !!countResult24Hr,
        metricsCountFor24Hr: !!countResult24Hr ? countResult24Hr.count : undefined,
      }
    } catch(e: any) {
      this.error(`Error encountered updating metrics`, e);

      return {
        success: false,
        message: 'encountered error',
        error: e,
        metricName,
      }
    }
  }

  async getCountForInterval(
    metricName: string,
    timestamp: number,
    saveCountToDataStore: boolean,
    cleanCache: boolean,
  ): Promise<CountResult | undefined> {
    try {
      if(!this.counters.hasOwnProperty(metricName)) {
        this.error(`Metric ${metricName} not found in cache`);
        return undefined;
      }

      const countForInterval: number | undefined = this.counters[metricName].countMetricsForInterval(
        this.interval,
        timestamp,
      );

      if(typeof(countForInterval) === 'undefined') {
        this.error(`Failed to get metrics count for interval for ${metricName}`);
        return undefined;
      }

      if(saveCountToDataStore) {
        this.log(`Saving metrics count for interval for ${metricName}`);

        await this.metricsCounterStore.save(
          metricName,
          this.interval,
          countForInterval,
          timestamp,
        );
      }

      if(cleanCache) {
        this.counters[metricName].deleteAllMetricsOlderThanTimestamp(timestamp);
      }

      return {
        count: countForInterval,
        interval: this.interval,
        metricName,
      }
    } catch(e: any) {
      this.error(`Encountered error while trying to get count for interval`, e);
    }
  }

  async getCountForLast24Hr(
    metricName: string,
    timestamp: number,
    saveCountToDataStore: boolean,
  ): Promise<CountResult | undefined> {
    try {
      const count: number | undefined = await this.metricsCounterStore.get24HrCountFromIntervals(
        metricName,
        timestamp,
      );

      if(typeof(count) === 'undefined') {
        this.error(`Failed to get count from intervals for last 24 hours`);
        return undefined;
      }

      if(saveCountToDataStore) {
        await this.metricsCounterStore.save(
          metricName,
          TWENTY_FOUR_HOUR_MS,
          count,
          timestamp,
        );
      }

      return {
        count,
        interval: TWENTY_FOUR_HOUR_MS,
        metricName,
      }
    } catch(e: any) {
      this.error(`Encountered error while trying to get count for last 24 hr`, e);
    }
  }
}
