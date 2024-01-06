// @ts-nocheck
import {Entity, Column, PrimaryGeneratedColumn} from "typeorm"

@Entity('metrics_counter')
export class MetricsCounter {
  @PrimaryGeneratedColumn('integer', { generated: true })
  id: number;

  @Column({ name: 'metric_name', type: 'varchar' })
  metricName: string;

  @Column({ name: 'interval', type: 'integer' })
  interval: number;

  @Column({ name: 'count', type: 'integer' })
  count: number;

  @Column({ name: 'interval_end_timestamp_ms', type: 'bigint' })
  intervalEndTimestampMs: string;
}
