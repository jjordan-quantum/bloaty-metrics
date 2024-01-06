export const metricsCounterIntervalIndex: string = `
  CREATE INDEX IF NOT EXISTS metrics_counter_interval_idx ON metrics_counter (interval);
`;
