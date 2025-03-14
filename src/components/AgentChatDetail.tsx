import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function AgentChatDetail() {

  return (
    <Observer>
      {() => (
        <div className="chat-panel agent-chat-detail agent-detail-table">
          <table>
            {chatStoreService.agentMessageDetail.map((message, index) => (
              <tr key={index}>
                <td>{message}</td>
              </tr>
            ))}
          </table>
  
        </div>
      )}
    </Observer>
  );
}
