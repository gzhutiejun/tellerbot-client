/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeAutoObservable } from "mobx";

export class ChatStoreService {
  customerMessage: string = "";
  agentMessage: string = "";
  agentMessageDetail: string[] = [];
  mic: boolean = false;
  status: string = "";
  debugMode: boolean = false;
  audioUrl: string = "";
  sessionId: string = "";
  conversationStarted: boolean = false;
  startConversationHandler: any = null;
  audioPlayCompleteHandler: any = null;
  constructor() {
    makeAutoObservable(this);
  }
  setCustomerMessage(message: string) {
    this.customerMessage = message;
  }
  setAgentMessage(message: string) {
    this.agentMessage = message;
  }
  addAgentMessageDetail(message: string) {
    this.agentMessageDetail.push(message + "\r\n");
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
    this.sessionId = sessionId;
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
    this.agentMessage = "";
    this.agentMessageDetail = [];
  }
}

const chatStoreService = new ChatStoreService();
export { chatStoreService };

// chatStoreService.setAgentMessage("Hello, how can I help you?");
// chatStoreService.addAgentMessageDetail("Currency: USD");
// chatStoreService.addAgentMessageDetail("Amount: 100");
// chatStoreService.setCustomerMessage("I have a question about my order.");
