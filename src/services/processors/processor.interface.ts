export type ChatbotActionType = "Continue" | "Cancel" | "End";
export interface IPrompt {
    messages?: string[];
    language?: string;
}
export interface ChatbotAction {
    actionType: ChatbotActionType;
    prompt: IPrompt;
}
export interface IProcessor {
    start():Promise<ChatbotAction>;
    process(text: string): Promise<ChatbotAction>;
}