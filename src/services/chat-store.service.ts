/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable } from "mobx";
import { ISessionContext } from "./model-interface";

export class ChatStoreService {
  customerMessage: string = "";
  agentMessages: string[] = [];
  mic: boolean = false;
  status: string = "";
  debugMode: boolean = false;
  audioUrl: string = "";
  conversationStarted: boolean = false;
  startConversationHandler: any = null;
  audioPlayCompleteHandler: any = null;
  cancelHandler:any = null;
  notification: boolean = false;
  language: string = "en";
  sessionContext: ISessionContext = {
    sessionId: "",
  }
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
  }
  setMic(mic: boolean) {
    this.mic = mic;
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
  setAudioPlayComplete() {
    if (this.notification) return;
    if (this.audioPlayCompleteHandler) this.audioPlayCompleteHandler();
  }

  registerStartConversationHandler(handler: any) {
    this.startConversationHandler = handler;
  }

  registerAudioPlayCompleteHandler(handler: any) {
    this.audioPlayCompleteHandler = handler;
  }

  registerCancelHandler(handler:any) {
    this.cancelHandler = handler;
  }
  resetSessionContext() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.status = "";
    this.sessionContext = {
      sessionId: "",
      transactionContext: {}
    }
  }
  resetTransactionContext() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.status = "";
    this.sessionContext.transactionContext = {}
  }
}

const chatStoreService = new ChatStoreService();
export { chatStoreService };

