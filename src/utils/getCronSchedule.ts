import {CacheInterval} from "../types/types";

export function getCronSchedule(cacheInterval: CacheInterval): string | undefined {
  switch(cacheInterval) {
    case CacheInterval.oneMin:
      return '* * * * *';
    case CacheInterval.twoMin:
      return '*/2 * * * *';
    case CacheInterval.fiveMin:
      return '*/5 * * * *';
    case CacheInterval.tenMin:
      return '*/10 * * * *';
    case CacheInterval.fifteenMin:
      return '*/15 * * * *';
    case CacheInterval.twentyMin:
      return '*/20 * * * *';
    case CacheInterval.thirtyMin:
      return '*/30 * * * *';
    case CacheInterval.oneHour:
      return '0 * * * *';
    default:
      return undefined;
  }
}
