import {ILogger} from "../interfaces";

class Logger implements ILogger {
  log(message: string): void {
    // tslint:disable-next-line:no-console
    console.log(message);
  }

  error(message: string, error?: Error): void {
    if(error) {
      // tslint:disable-next-line:no-console
      console.log(message);
      // tslint:disable-next-line:no-console
      console.log(error);
    } else {
      // tslint:disable-next-line:no-console
      console.log(message);
    }
  }
}

export default Logger;
