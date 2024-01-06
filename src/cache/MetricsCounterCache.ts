import NodeCache from "node-cache";
import {getRandom} from "../utils/getRandom";
import {ILogger} from "../interfaces";
import Component from "../lib/Component";

class MetricsCounterCache extends Component {
  cache!: NodeCache;
  metricName?: string;
  serviceName?: string;

  constructor(metricName: string, logger: ILogger) {
    super(logger);
    this.cache = new NodeCache();
    this.metricName = metricName;
    this.serviceName = `${metricName}MetricsCounter`;
  }

  public addRecord(timestamp?: number): boolean {
    try {
      return this.cache.set(
        this.getKey(timestamp || Date.now(), getRandom()),
        1,
      );
    } catch(e: any) {
      this.error(`Error adding metrics count record`, e);
      return false;
    }
  }

  getAllKeysForInterval(interval: number, timestamp: number): string[] | undefined {
    try {
      const keys: string[] = this.cache.keys();
      const returnKeys: string[] = [];
      const intervalStart: number = timestamp - interval;

      for(const key of keys) {
        const [
          _timestamp,
          _id,
        ] = key.split(':');

        const keyTimestamp: number = parseInt(_timestamp);

        if((keyTimestamp > intervalStart) && (keyTimestamp <= timestamp)) {
          returnKeys.push(key);
        }
      }

      return returnKeys.slice();
    } catch(e: any) {
      this.error(`Error trying to get all keys for interval`, e);
      return undefined;
    }
  }

  countMetricsForInterval(interval: number, timestamp: number): number | undefined {
    try {
      return this.getAllKeysForInterval(interval, timestamp)?.length;
    } catch(e: any) {
      this.error(`Error trying to count metrics for interval`, e);
      return undefined;
    }
  }

  deleteAllMetricsOlderThanTimestamp(timestamp: number): number | undefined {
    try {
      const keys: string[] = this.cache.keys();
      const deleteKeys: string[] = [];

      for(const key of keys) {
        const [
          _timestamp,
          _id,
        ] = key.split(':');

        const keyTimestamp: number = parseInt(_timestamp);

        if(keyTimestamp < timestamp) {
          deleteKeys.push(key);
        }
      }

      return this.cache.del(deleteKeys.slice());
    } catch(e: any) {
      this.error(`Error trying to delete all metrics older than timestamp`, e);
      return undefined;
    }
  }

  getKey(timestamp: number, id: number): string {
    return `${timestamp}:${id}`;
  }
}

export default MetricsCounterCache;
