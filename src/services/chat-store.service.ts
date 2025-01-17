import { makeAutoObservable } from "mobx";

interface IChatMessage {
	id: string;
	content: string;
	sender: "agent" | "customer";
}

export class ChatStoreService {
   messages: IChatMessage[] = [];
   mic: boolean = false;

   constructor() {
    makeAutoObservable(this);
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
	}

}

const chatStoreService = new ChatStoreService();
export { chatStoreService };

chatStoreService.addMessage("Hello, how can I help you?", "agent");
chatStoreService.addMessage("I have a question about my order.", "customer");
