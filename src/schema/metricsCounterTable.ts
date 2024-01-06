export const metricsCounterTable: string = `
CREATE TABLE IF NOT EXISTS metrics_counter (
  id                            integer DEFAULT         nextval('seq_metrics_counter'::regclass) NOT NULL,
  metric_name                   varchar(100)            NOT NULL,
  interval                      integer                 NOT NULL,
  count                         integer                 NOT NULL,
  interval_end_timestamp_ms     bigint                  NOT NULL,
  CONSTRAINT                    pk_metrics_counter_id PRIMARY KEY (id)
);`;
