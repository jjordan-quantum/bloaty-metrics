import {DataSource, MoreThan, Not, QueryRunner, Repository} from "typeorm";
import {MetricsCounter} from "../entitiy/MetricsCounter";
import {ILogger} from "../interfaces";
import Component from "./Component";
import {TWENTY_FOUR_HOUR_MS} from "../utils/constants";
import {schema} from "../schema/schema";
import Logger from "./Logger";

export class MetricsCounterStore extends Component {
  repository!: Repository<MetricsCounter>;
  dataSource!: DataSource;

  constructor(
    dataSource: DataSource,
    logger?: ILogger
  ) {
    super(logger || new Logger());
    this.dataSource = dataSource
    this.repository = dataSource.getRepository(MetricsCounter);
  }

  async deploy(): Promise<boolean> {
    try {
      const queryRunner: QueryRunner = await this.dataSource.createQueryRunner();
      await queryRunner.connect();
      let success: boolean = true;

      for(const script of schema) {
        try {
          await queryRunner.manager.query(script);
        } catch(e: any) {
          this.error(`The following query encountered an error: ${script}`, e);
          success = false;
        }
      }

      await queryRunner.release();
      return success;
    } catch(e: any) {
      this.error(`Error trying to deploy schema`, e);
      return false;
    }
  }

  async getLatest24HrRecord(metricName: string): Promise<MetricsCounter | undefined> {
    try {
      return (await this.repository.findOne({
        where: {
          metricName,
          interval: TWENTY_FOUR_HOUR_MS,
        },
        order: {
          intervalEndTimestampMs: "DESC",
        },
      })) || undefined;
    } catch(e: any) {
      this.error(`Failed to get latest 24 hr count`, e);
      return undefined;
    }
  }

  async getLatest24HrCount(metricName: string): Promise<number | undefined> {
    try {
      return (await this.getLatest24HrRecord(metricName))?.count;
    } catch(e: any) {
      this.error(`Failed to get latest 24 hr count`, e);
      return undefined;
    }
  }

  async get24HrCountFromIntervals(
    metricName: string,
    timestamp: number,
  ): Promise<number | undefined> {
    try {
      const targetTimestamp: number = timestamp - TWENTY_FOUR_HOUR_MS;

      const results: MetricsCounter[] | null = await this.repository.find({
        where: {
          metricName,
          interval: Not(TWENTY_FOUR_HOUR_MS),
          intervalEndTimestampMs: MoreThan(String(targetTimestamp)),
        },
      });

      if(!results) {
        this.error(`Failed to find MetricsCounter records`);
        return undefined;
      }

      if(results.length === 0) {
        this.error(`No MetricsCounter records found`);
        return undefined;
      }

      let total: number = 0;

      for(const counter of results) {
        const {
          intervalEndTimestampMs,
          count,
        } = counter;

        // tslint:disable-next-line:radix
        if(parseInt(intervalEndTimestampMs) > timestamp) {
          continue;
        }

        total += count;
      }

      return total;
    } catch(e: any) {
      this.error(`Failed to get interval counts`, e);
      return undefined;
    }
  }

  async countAll(
    metricName: string,
    isFor24Hr?: boolean,
  ): Promise<number | undefined> {
    try {
      return (typeof(isFor24Hr) === 'undefined') ? (await this.repository.count({
        where: {
          metricName,
        }
      })) : (isFor24Hr ? (await this.repository.count({
        where: {
          metricName,
          interval: TWENTY_FOUR_HOUR_MS,
        }
      })) : (await this.repository.count({
        where: {
          metricName,
          interval: Not(TWENTY_FOUR_HOUR_MS),
        }
      })));
    } catch(e: any) {
      this.error(`Error trying to count all results`, e);
      return undefined;
    }
  }

  async save(
    metricName: string,
    interval: number,
    count: number,
    intervalEndTimestampMs: number,
  ): Promise<boolean> {
    try {
      return !!(await this.repository.save(this.repository.create({
        metricName,
        interval,
        count,
        intervalEndTimestampMs: String(intervalEndTimestampMs),
      })));
    } catch(e: any) {
      this.error(`Error trying to save request counter metric`, e);
      return false;
    }
  }

  async cleanup24Hr(metricName: string): Promise<number | undefined> {
    try {
      const start = await this.countAll(metricName, true);
      const latestRecord: MetricsCounter | undefined = await this.getLatest24HrRecord(metricName);

      if(!latestRecord) {
        this.error(`Failed to find latest record for ${metricName}`);
        return undefined;
      }

      const {id} = latestRecord;

      await this.dataSource.manager.query(`
        DELETE FROM metrics_counter WHERE metric_name = '${metricName}' AND interval = ${TWENTY_FOUR_HOUR_MS} AND id != ${id};
      `);

      const end = await this.countAll(metricName, true);
      return ((typeof(start) !== 'undefined') && (typeof(end) !== 'undefined')) ? (start - end) : undefined;
    } catch(e: any) {
      this.error(`Error trying to delete old 24 hour counts`, e);
      return undefined;
    }
  }

  async cleanupInterval(metricName: string, timestamp: number): Promise<number | undefined> {
    try {
      const start = await this.countAll(metricName, false);

      await this.dataSource.manager.query(`
        DELETE FROM metrics_counter WHERE metric_name = '${metricName}' AND interval != ${TWENTY_FOUR_HOUR_MS} AND interval_end_timestamp_ms < ${timestamp};
      `);

      const end = await this.countAll(metricName, false);
      return ((typeof(start) !== 'undefined') && (typeof(end) !== 'undefined')) ? (start - end) : undefined;
    } catch(e: any) {
      this.error(`Error trying to delete counts older than 24 hr`, e);
      return undefined;
    }
  }
}
