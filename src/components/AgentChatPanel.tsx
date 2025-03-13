import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function AgentChatPanel() {
  return (
    <Observer>
      {() => (
        <div className="chat-panel agent-chat">
          <label>{chatStoreService.agentMessage}</label>
        </div>
      )}
    </Observer>
  );
}
