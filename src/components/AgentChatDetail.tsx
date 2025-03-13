import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function AgentChatDetail() {
  return (
    <Observer>
      {() => (
        <div className="agent-chat-detail agent-detail-table">
          <tbody>
            {chatStoreService.agentMessageDetail.map((message, index) => (
              <tr key={index}>
                <td>{message}</td>
              </tr>
            ))}
          </tbody>
        </div>
      )}
    </Observer>
  );
}
