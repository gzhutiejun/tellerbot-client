import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function AgentChatPanel() {
  return (
    <Observer>
      {() => (
        <div className="chat-panel agent-chat-detail agent-detail-table">
          <table>
            <tbody>
              {chatStoreService.agentMessages.map((message, index) => (
                <tr key={index}>
                  <td>{message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Observer>
  );
}
