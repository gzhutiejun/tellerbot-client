/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable } from "mobx";
import { ISessionContext } from "./model-interface";
import { myLoggerService } from "./logger.service";
export type ChatbotActionType =
  | "Idle"
  | "None"
  | "Repeat"
  | "NewSession"
  | "ContinueSession"
  | "Cancel"
  | "NewTransaction"
  | "ContinueTransaction"
  | "EndTransaction"
  | "Notification"
  | "AtmInteraction";

export class ChatStoreService {
  listenEarly = false;
  playing: boolean = false;
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
  playAudioOnly: boolean = false;
  supportedDepositCurrencies: string[] = ["HKD", "USD", "CNY"];
  supportedWithdrawalCurrencies: string[] = ["HKD", "USD", "CNY"];
  supportedDepositTerms?: string[] = ["3 months", "6 months", "1 year", "3 years"];
  language: string = "en";
  chatbotUrl: string = "";
  sessionContext: ISessionContext = {
    sessionId: "",
  };

  repeatCount = 0;
  constructor() {
    makeAutoObservable(this);
  }
  setPlayAudioOnly(playModeOnly: boolean) {
    this.playAudioOnly = playModeOnly;
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
    myLoggerService.log("setAudioUrl: " + url);
    this.audioUrl = url;

    if (this.audioUrl && !this.playAudioOnly) {
      setTimeout(() => {
        myLoggerService.log("setAudioUrl: ready to record media");
        if (this.listenEarly && this.startListeningHandler)
          this.startListeningHandler();
      });
    }
  }
  setMic(mic: boolean) {
    this.mic = mic;
  }

  setLanguage(lang: string) {
    myLoggerService.log("chatStoreService:setLanguage:" + lang)
    this.language = lang;
  }
  increaseRepeatCount() {
    this.repeatCount++;
  }
  resetRepeatCount() {
    this.repeatCount = 0;
  }
  setNotification(status: boolean) {
    this.notification = status;
  }
  setPlaying() {
    this.playing = true;
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
  setAudioPlayComplete() {
    this.playing = false;
    console.log("setAudioPlayComplete: playAudioOnly:", this.playAudioOnly);
    if (!this.listenEarly && !this.playAudioOnly) {
      this.startListeningHandler();
    }
  }

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
