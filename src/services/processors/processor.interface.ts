export type ActionType = "Continue" | "Cancel" | "End";
export interface IPrompt {
    messages?: string[];
    language?: string;
}
export interface Action {
    actionType: ActionType;
    prompt: IPrompt;
}
export interface IProcessor {
    process(text: string): Action;
}