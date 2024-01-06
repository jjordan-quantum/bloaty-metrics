import {metricsCounterSequence} from "./metricsCounterSequence";
import {metricsCounterTable} from "./metricsCounterTable";
import {metricsCounterIntervalEndTimestampMsIndex} from "./metricsCounterIntervalEndTimestampMsIndex";
import {metricsCounterIntervalIndex} from "./metricsCounterIntervalIndex";
import {metricsCounterMetricsNameIndex} from "./metricsCounterMetricsNameIndex";

export const schema: string[] = [
  metricsCounterSequence,
  metricsCounterTable,
  metricsCounterIntervalEndTimestampMsIndex,
  metricsCounterIntervalIndex,
  metricsCounterMetricsNameIndex,
];
