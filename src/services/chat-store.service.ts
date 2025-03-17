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
  setAudioPlayComplete() {
    if (this.audioPlayCompleteHandler) this.audioPlayCompleteHandler();
  }

  registerStartConversationHandler(handler: any) {
    this.startConversationHandler = handler;
  }

  registerAudioPlayCompleteHandler(handler: any) {
    this.audioPlayCompleteHandler = handler;
  }
  resetSessionContext() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.sessionContext = {
      sessionId: "",
      transactionContext: {}
    }
  }
  resetTransactionContext() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.sessionContext.transactionContext = {}
  }
}

const chatStoreService = new ChatStoreService();
export { chatStoreService };

