export type ChatbotActionType = "NewTransaction" | "Continue" | "Cancel" | "End";
export interface IPrompt {
  messages?: string[];
  language?: string;
}
export interface ChatbotAction {
  actionType?: ChatbotActionType;
  prompt?: IPrompt;
  transactionName?: TransactionName;
}
export interface IProcessor {
  chatbotWebUrl: string;
  start(): void;
  process(text: string): Promise<ChatbotAction>;
}
export type TransactionName ="cash-deposit" | "cash-withdrawal" | "time-deposit" | "none";