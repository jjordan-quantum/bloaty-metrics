import Component from "./Component";
import {ILogger} from "../interfaces";
const cron = require('node-cron');

export class MetricsScheduler extends Component {
  _schedule!: string;

  constructor(
    schedule: string,
    logger: ILogger
  ) {
   super(logger);
   this._schedule = schedule;
  }

  start(logMetricsCallBack: Function): any {
    return cron.schedule(this._schedule, logMetricsCallBack);
  }
}
