import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function Dialog() {
  return (
    <Observer>
      {() => (
        <div>
          <label>{chatStoreService.agentMessage}</label>
          <label>{chatStoreService.customerMessage}</label>
        </div>
      )}
    </Observer>
  );
}
