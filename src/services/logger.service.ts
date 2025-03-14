/* eslint-disable @typescript-eslint/no-explicit-any */
export class LoggerService {
  constructor() {}
  log(message: any) {
    console.log(message);
  }
}

const myLoggerService = new LoggerService();
export { myLoggerService };
