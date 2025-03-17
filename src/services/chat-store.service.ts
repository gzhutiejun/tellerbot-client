/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable } from "mobx";

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
  context = {
    sessionId: "",
  }
  constructor() {
    makeAutoObservable(this);
  }
  setCustomerMessage(message: string) {
    this.customerMessage = message;
  }
  addAgentMessage(message: string) {
    this.agentMessages.push(message + "\r\n");
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
    this.context.sessionId = sessionId;
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
  clear() {
    this.customerMessage = "";
    this.agentMessages = [];
    this.context = {
      sessionId: ""
    }
  }
}

const chatStoreService = new ChatStoreService();
export { chatStoreService };

// chatStoreService.setAgentMessage("Hello, how can I help you?");
// chatStoreService.addAgentMessageDetail("Currency: USD");
// chatStoreService.addAgentMessageDetail("Amount: 100");
// chatStoreService.setCustomerMessage("I have a question about my order.");
