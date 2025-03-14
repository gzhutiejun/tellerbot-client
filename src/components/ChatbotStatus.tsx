import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function ChatbotStatus() {
  return (
    <Observer>
      {() => (
        <div className="chat-panel chatbot-status">
          <label>{chatStoreService.status}</label>
        </div>
      )}
    </Observer>
  );
}
