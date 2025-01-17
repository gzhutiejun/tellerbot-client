import { makeAutoObservable } from "mobx";

interface IDialogMessage {
	id: string;
	content: string;
	sender: "agent" | "customer";
}

export class DataStoreService {
   messages: IDialogMessage[] = [];

   constructor() {
    makeAutoObservable(this);
   }
  	/**
	 * Send a new message
	 * @param content Message content
	 * @param sender Message sender (agent/customer)
	 */
	addMessage(content: string, sender: "agent" | "customer") {
		const newMessage: IDialogMessage = {
			id: crypto.randomUUID(),
			content,
			sender,
		};
		this.messages.push(newMessage);
	}

}

const dataStoreService = new DataStoreService();
export { dataStoreService };

dataStoreService.addMessage("Hello, how can I help you?", "agent");
dataStoreService.addMessage("I have a question about my order.", "customer");
