import { chatStoreService } from "../services/chat-store.service";

import { Card } from "primereact/card";

export default function Dialog() {
  return (
    <Card
      className="chat-container relative"
      pt={{ content: { className: "p-0" } }}
    >
      <div className="messages p-2">
        {chatStoreService.messages.map((msg) => (
          <div key={msg.id} className={`message-item ${msg.sender}`}>
            <div className="message-header mb-1">
              <div className="text-500">
                {msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)}
              </div>
            </div>
            <span className="text-sm">{msg.content}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
