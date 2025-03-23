/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable } from "mobx";
import { ISessionContext } from "./model-interface";
export type ChatbotActionType =
  | "Idle"
  | "Repeat"
  | "NewSession"
  | "ContinueSession"
  | "Cancel"
  | "NewTransaction"
  | "ContinueTransaction"
  | "EndTransaction"
  | "Notification";
export enum ChatState {
  interactive = 1,
  notification = 2,
}
export class ChatStoreService {
  customerMessage: string = "";
  agentMessages: string[] = [];
  mic: boolean = false;
  status: string = "";
  debugMode: boolean = false;
  audioUrl: string = "";
  conversationStarted: boolean = false;
  startConversationHandler: any = null;
  startListeningHandler: any = null;
  cancelHandler: any = null;
  notification: boolean = false;
  language: string = "en";
  chatbotUrl: string = "";
  sessionContext: ISessionContext = {
    sessionId: "",
  };
  chatState: ChatState = 1;
  constructor() {
    makeAutoObservable(this);
  }
  setCustomerMessage(message: string) {
    this.customerMessage = message;
  }
  addAgentMessage(message: string) {
    this.agentMessages.push(message);
  }
  clearAgentMessages() {
    this.agentMessages = [];
  }
  setAudioUrl(url: string) {
    this.audioUrl = url;

    if (this.audioUrl) {
      setTimeout(() => {
        console.log("ready to record media");
        if (this.startListeningHandler) this.startListeningHandler();
      }, 1000);
    }
  }
  setMic(mic: boolean) {
    this.mic = mic;
  }
  setChatState(state: ChatState) {
    this.chatState = state;
  }
  setLanguage(lang: string) {
    this.language = lang;
  }

  setNotification(status: boolean) {
    this.notification = status;
  }
  setStatus(status: string) {
    this.status = status;
  }
  setSessionId(sessionId: string) {
    this.sessionContext.sessionId = sessionId;
  }
  setDebugMode(debugMode: boolean) {
    this.debugMode = debugMode;
  }
  startConversation() {
    if (this.startConversationHandler) {
      this.conversationStarted = true;
      this.startConversationHandler();
    }
  }
  cancel() {
    if (this.cancelHandler) {
      this.cancelHandler();
    }
  }
  setAudioPlayComplete() {}

  registerStartConversationHandler(handler: any) {
    this.startConversationHandler = handler;
  }

  registerStartListeningHandler(handler: any) {
    this.startListeningHandler = handler;
  }

  registerCancelHandler(handler: any) {
    this.cancelHandler = handler;
  }
  resetSessionContext() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.status = "";
    this.sessionContext = {
      sessionId: "",
      transactionContext: {},
    };
  }
  resetTransactionContext() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.status = "";
    this.sessionContext.transactionContext = {};
  }
}

const chatStoreService = new ChatStoreService();
export { chatStoreService };
