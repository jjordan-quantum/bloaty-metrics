import {ILogger} from "../interfaces";

class Logger implements ILogger {
  log(message: string): void {
    console.log(message);
  }

  error(message: string, error?: Error): void {
    if(error) {
      console.log(message);
      console.log(error);
    } else {
      console.log(message);
    }
  }
}

export default Logger;
