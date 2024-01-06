import {DataSource} from "typeorm";
import {ILogger} from "../interfaces";
import Logger from "./Logger";
import Component from "./Component";
import {MetricsCounterStore} from "./MetricsCounterStore";
import MetricsCounterCache from "../cache/MetricsCounterCache";
import {TWENTY_FOUR_HOUR_MS} from "../utils/constants";

export type CountResult = {
  count: number;
  interval: number;
  metricName: string;
}

export class MetricsManager extends Component {
  dataSource!: DataSource;
  metricsCounterStore!: MetricsCounterStore;
  interval!: number;
  counters: {[key: string]: MetricsCounterCache} = {};

  constructor(
    dataSource: DataSource,
    keys: string[],
    interval: number,
    logger?: ILogger
  ) {
    super(logger || (new Logger()));
    this.dataSource = dataSource;
    this.interval = interval

    this.metricsCounterStore = new MetricsCounterStore(
      dataSource,
      this.logger,
    );

    for(const key of keys) {
      this.counters[key] = new MetricsCounterCache(key, this.logger);
    }
  }

  countMetricSync(key: string): void {
    if(this.counters.hasOwnProperty(key)) {
      this.counters[key].addRecord();
    } else {
      this.error(`Counter not found for key ${key}`);
    }
  }

  async countMetric(key: string): Promise<void> {
    this.countMetricSync(key);
  }

  async getCountForInterval(
    metricName: string,
    timestamp: number,
    saveCountToDataStore: boolean,
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
