export type ChatbotActionType = "Idle" | "NewSession" | "ContinueSession" | "Cancel" | "NewTransaction" | "ContinueTransaction" | "EndTransaction" | "Notification";

export interface ChatbotAction {
  actionType: ChatbotActionType;
  prompt?: string[];
  transactionName?: TransactionName;
}
export interface IProcessor {
  start(): void;
  process(text: string): Promise<ChatbotAction>;
}
export type TransactionName ="cash-deposit" | "cash-withdrawal" | "time-deposit" | "none";