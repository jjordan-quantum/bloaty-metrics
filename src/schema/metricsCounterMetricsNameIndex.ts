export const metricsCounterMetricsNameIndex: string = `
  CREATE INDEX IF NOT EXISTS metrics_counter_metric_name_idx ON metrics_counter (metric_name);
`;
