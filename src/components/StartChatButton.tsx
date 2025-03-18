import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
import { If } from "./if";
export default function StartChatButton() {
  return (
    <Observer>
      {() => (
        <If condition={chatStoreService.debugMode && !chatStoreService.conversationStarted}>
          <button
            className="chatbot-button"
            onClick={() => chatStoreService.startConversation()}
          >
            Start Conversation
          </button>
        </If>
      )}
    </Observer>
  );
}
