/* eslint-disable @typescript-eslint/no-explicit-any */

import { GenerateAudioResponse } from "../services/bus-op.interface";
import { chatStoreService } from "../services/chat-store.service";
import { myChatbotServiceAgent } from "../services/chatbot-service-agent";
import { translate } from "../services/i18n/i18n.service";
import { myLoggerService } from "../services/logger.service";
import { CashWithdrawalTxProcessor } from "../services/processors/cash-withdrawal-processor";
import {
  IProcessor,
  TransactionName,
} from "../services/processors/processor.interface";
import { TimeDepositTxProcessor } from "../services/processors/time-deposit-processor";

export function createTransactionProcessor(tx: TransactionName): IProcessor {
  let processor: IProcessor | undefined;
  switch (tx) {
    case "cash-withdrawal":
      processor = new CashWithdrawalTxProcessor();
      break;
    case "time-deposit":
      processor = new TimeDepositTxProcessor();
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
    ret = "good afternoon";
  } else if (currentHour >= 17) {
    ret = "good evening";
  } else {
    ret = "good morning";
  }

  return ret;
}

export function repeat() {
  const prompt = translate("sorry") + "," + translate("repeat");
  playAudio([prompt]);
}
export async function playAudio(prompts: string[], playMode: boolean = false) {
  myLoggerService.log("playAudio");
  chatStoreService.clearAgentMessages();
  chatStoreService.setPlayAudioOnly(playMode);
  const questionText = prompts[0];
  prompts.map((q) => {
    chatStoreService.addAgentMessage(q);
  });

  const ttsRes: GenerateAudioResponse =
    await myChatbotServiceAgent?.generateaudio(
      JSON.stringify({
        action: "generateaudio",
        sessionId: chatStoreService.sessionContext.sessionId,
        text: questionText,
        language: chatStoreService.language,
      })
    );

  if (ttsRes && ttsRes.fileName) {
    chatStoreService.setAudioUrl(
      `${chatStoreService.chatbotUrl}/download/${ttsRes.fileName}`
    );
  }
}

export function replayAudio() {
  myLoggerService.log("replayAudio");

  // chatStoreService.increaseRepeatCount();
  // if (chatStoreService.repeatCount <= 3) {
  //   if (chatStoreService.startListeningHandler)
  //     chatStoreService.startListeningHandler();
  //   return;
  // }
  // chatStoreService.resetRepeatCount();
  const url = chatStoreService.audioUrl;
  chatStoreService.setAudioUrl("");
  setTimeout(() => {
    chatStoreService.setAudioUrl(url);
  }, 500);
}

export function extractAccount(account: string): string {
  if (!account) return "";
  const acc = account.toLowerCase();
  if (acc.includes("credit")) return "credit";
  if (acc.includes("debit")) return "debit";
  if (acc.includes("saving")) return "saving";
  if (acc.includes("cheque") || acc.includes("check")) return "cheque";
  if (acc.includes("default")) return "default";
  return "";
}

export function extractCurrency(currency: string): string {
  if (!currency) return "";
  const curr = currency.toLowerCase();
  if (curr.includes("hk") || curr.includes("hong kong")) return "HKD";
  if (curr.includes("us")) return "USD";
  if (curr.includes("tw") || curr.includes("tai wan") || curr.includes("taiwan")) return "TWD";
  if (curr.includes("eur") || curr.includes("europe")) return "EUR";
  return "";
}

export function extractCancel(data: any): boolean {
  if (!data) return false;
  if ("string" === typeof data && data.toLowerCase().includes("true")) return true;
  if ("boolean" === typeof data && data) return true;
  return false;
}

export function extractDepositTerm(term: string, terms: string[]): string {
  if (!term) return "";
  let ret:string = "";
  for (let i = 0; i < terms.length; i++) {
    if (term.toLowerCase().includes(terms[i])) {
      ret = terms[i];
      break;
    }
  }
  return ret;
}

