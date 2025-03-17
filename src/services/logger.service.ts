/* eslint-disable @typescript-eslint/no-explicit-any */
export class LoggerService {
  constructor() {}
  log(message: any) {
    console.log(this.getFormattedDate(), message);
  }

  private getFormattedDate(): string {
    let dateString = "";
    const date: Date = new Date();
    const day = this.padZeroToSingleDigit(date.getDate());
    const month = this.padZeroToSingleDigit(date.getMonth() + 1);
    const year = date.getFullYear().toString();
    const hours = this.padZeroToSingleDigit(date.getHours());
    const minutes = this.padZeroToSingleDigit(date.getMinutes());
    const seconds = this.padZeroToSingleDigit(date.getSeconds());

    dateString =
      year +
      "-" +
      month +
      "-" +
      day +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds;

    return dateString;
  }

  private padZeroToSingleDigit(value: number) {
    const retVal: string = value < 10 ? "0" + value : value.toString();
    return retVal;
  }
}

const myLoggerService = new LoggerService();
export { myLoggerService };
