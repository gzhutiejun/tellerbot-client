/* eslint-disable @typescript-eslint/no-explicit-any */

import { CashWithdrawalTxProcessor } from "../services/processors/cash-withdrawal-processor";
import {
  IProcessor,
  TransactionName,
} from "../services/processors/processor.interface";

export function extractTranscribedData(messageData: any): any {
  if (
    !messageData ||
    typeof messageData !== "object" ||
    !messageData.responseMessage ||
    !messageData.responseMessage.success
  ) {
    return undefined;
  }
  if (
    !messageData.responseMessage.data ||
    messageData.responseMessage.data.length < 5 ||
    messageData.responseMessage.data[0] !== "{"
  ) {
    return undefined;
  }
  try {
    return JSON.parse(messageData.responseMessage.data);
  } catch (error) {
    console.log(error);
    return undefined;
  }

  return messageData.responseMessage.data;
}

export function createTransactionProcessor(tx: TransactionName): IProcessor {
  let processor: IProcessor | undefined;
  switch (tx) {
    case "cash-withdrawal":
      processor = new CashWithdrawalTxProcessor();
      break;
    case "time-deposit":
      break;
  }
  return processor!;
}
export function getFormattedDate(): string {
  let dateString = "";
  const date: Date = new Date();
  const day = padZeroToSingleDigit(date.getDate());
  const month = padZeroToSingleDigit(date.getMonth() + 1);
  const year = date.getFullYear().toString();
  const hours = padZeroToSingleDigit(date.getHours());
  const minutes = padZeroToSingleDigit(date.getMinutes());
  const seconds = padZeroToSingleDigit(date.getSeconds());

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

export function padZeroToSingleDigit(value: number) {
  const retVal: string = value < 10 ? "0" + value : value.toString();
  return retVal;
}

export function getGreetingWords() {
  const currentHour = new Date().getHours();
  let ret;
  if (currentHour >= 12 && currentHour <= 17) {
    ret = "下午好";
  } else if (currentHour >= 17) {
    ret = "晚上好";
  } else {
    ret = "早晨好";
  }

  return ret;
}
