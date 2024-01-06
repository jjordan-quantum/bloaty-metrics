export type CacheKeys = {
  timestamp: number,
  id: number,
}

const now = Date.now();
const tenMinutesAgo = now - 10 * 60 * 1000;
const twentyMinutesAgo = now - 20 * 60 * 1000;

export const cache = [{
  timestamp: now,
  id: 13546516,
}, {
  timestamp: now - 1234,
  id: 9346535746,
}, {
  timestamp: now - 124,
  id: 98776425,
}, {
  timestamp: now - 12345,
  id: 134623656,
}, {
  timestamp: now - 23456,
  id: 6706587354763,
}, {
  timestamp: tenMinutesAgo,
  id: 3214521352,
}, {
  timestamp: tenMinutesAgo - 231,
  id: 568457357,
}, {
  timestamp: tenMinutesAgo - 1231,
  id: 78934758568,
}, {
  timestamp: tenMinutesAgo - 2231,
  id: 345756746,
}, {
  timestamp: tenMinutesAgo - 12356,
  id: 3456798877986,
}, {
  timestamp: twentyMinutesAgo,
  id: 987656765,
}, {
  timestamp: twentyMinutesAgo - 34654,
  id: 234567546545,
}];
