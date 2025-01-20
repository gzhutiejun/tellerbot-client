import { chatStoreService } from "../services/chat-store.service";
import { Card } from "primereact/card";
import { ScrollPanel } from "primereact/ScrollPanel";

export default function Dialog() {
  return (
    <ScrollPanel
      style={{ width: "100%", height: "80%", marginBottom: "20rem" }}
    >
      <Card className="chat-container">
        <div className="messages">
          {chatStoreService.messages.map((msg) => (
            <div key={msg.id} className={`message-item ${msg.sender}`}>
              <div className="message-header">
                {/* <div className="text-500"> */}
                {/* {msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)} */}
                {/* </div> */}
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
        </div>
      </Card>
    </ScrollPanel>
  );
}
