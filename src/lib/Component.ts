import {ILogger} from "../interfaces";

class Component {
  logger!: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  log(message: string): void {
    this.logger.log(message);
  }

  error(message: string, error?: any): void {
    this.logger.error(message, error);
  }
}

export default Component;
