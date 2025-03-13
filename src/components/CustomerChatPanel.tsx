import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function CustomerChatPanel() {
  return (
    <Observer>
      {() => (
        <div className="customer-chat">
          <label>{chatStoreService.customerMessage}</label>
        </div>
      )}
    </Observer>
  );
}
