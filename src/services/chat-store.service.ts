import { makeAutoObservable } from "mobx";

interface IChatMessage {
  id: string;
  content: string;
  sender: "agent" | "customer";
}

export class ChatStoreService {
  messages: IChatMessage[] = [];
  customerMessage: string = "";
  agentMessage: string = "";
  mic: boolean = false;
  maxItems: number = 10;
  constructor() {
    makeAutoObservable(this);
  }
  setCustomerMessage(message: string) {
    this.customerMessage = message;
  }
  setAgentMessage(message: string) {
    this.agentMessage = message;
  }
  /**
   * Send a new message
   * @param content Message content
   * @param sender Message sender (agent/customer)
   */
  addMessage(content: string, sender: "agent" | "customer") {
    const newMessage: IChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender,
    };
    this.messages.push(newMessage);
    if (this.messages.length > this.maxItems) {
      this.messages.shift();
    }
  }

  clear() {
    this.messages = [];
  }
}

const chatStoreService = new ChatStoreService();
export { chatStoreService };

// for (let i = 0; i < 5; i++) {
//   chatStoreService.addMessage("Hello, how can I help you?" + i.toString(), "agent");
//   chatStoreService.addMessage("I have a question about my order." + i.toString(), "customer");
// }

chatStoreService.setAgentMessage("Hello, how can I help you?");
chatStoreService.setCustomerMessage("I have a question about my order.");