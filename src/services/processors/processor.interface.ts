/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatbotActionType } from "../chat-store.service";

export interface ChatbotAction {
  actionType: ChatbotActionType;
  prompt?: string[];
  transactionName?: TransactionName;
  interactionMessage?: any;
  playAudioOnly?: boolean;
}
export interface IProcessor {
  start(): void;
  processText(text: string): Promise<ChatbotAction>;
  processAtmMessage(message: any): Promise<ChatbotAction>;
}
export type TransactionName ="cash-deposit" | "cash-withdrawal" | "time-deposit" | undefined;
