/* eslint-disable @typescript-eslint/no-explicit-any */

import { chatStoreService } from "../services/chat-store.service";
import { myChatbotServiceAgent } from "../services/chatbot-service-agent";
import { myLoggerService } from "../services/logger.service";
import { CashWithdrawalTxProcessor } from "../services/processors/cash-withdrawal-processor";
import {
  IProcessor,
  TransactionName,
} from "../services/processors/processor.interface";



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
    ret = "Good afternoon";
  } else if (currentHour >= 17) {
    ret = "Good evening";
  } else {
    ret = "Good morning";
  }

  return ret;
}


export async function playAudio(prompts: string[]) {
  myLoggerService.log("playAudio");
  chatStoreService.clearAgentMessages();
    let questionText = "";
    prompts.map((q) => {
      chatStoreService.addAgentMessage(q);
      questionText += q + ".";
    });

    const ttsRes = await myChatbotServiceAgent?.generateaudio(
      JSON.stringify({
        action: "generateaudio",
        sessionId: chatStoreService.sessionContext.sessionId,
        text: questionText,
        language: chatStoreService.language,
      })
    );

    if (
      ttsRes &&
      ttsRes.responseMessage &&
      ttsRes.responseMessage.file_name
    ) {
      chatStoreService.setAudioUrl(
        `${ chatStoreService.chatbotUrl}/download/${ttsRes.responseMessage.file_name}`
      );
    }
}

export function replayAudio() {
  myLoggerService.log("replayAudio");
  const url = chatStoreService.audioUrl;
  chatStoreService.setAudioUrl("");
  setTimeout(() => {
    chatStoreService.setAudioUrl(url);
  },500);
}