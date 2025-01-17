import { dataStoreService } from "../services/data-store.service";

export default function Dialog() {
    return (
        <div className="messages p-2">
        {dataStoreService.messages.map((msg) => (
            <div key={msg.id} className={`message-item ${msg.sender}`}>
                <div className="message-header mb-1">
                    <small className="text-500">
                        {msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)} -{" "}
                    </small>
                </div>
                <span className="text-sm">{msg.content}</span>
            </div>
        ))}
    </div>
    );
}