export const metricsCounterIntervalEndTimestampMsIndex: string = `
  CREATE INDEX IF NOT EXISTS metrics_counter_interval_end_timestamp_ms_idx ON metrics_counter (interval_end_timestamp_ms);
`;
