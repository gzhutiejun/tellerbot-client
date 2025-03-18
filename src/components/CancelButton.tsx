import { chatStoreService } from "../services/chat-store.service";
import { Observer } from "mobx-react-lite";
export default function CancelButton() {
  return (
    <Observer>
      {() => (
        <button
          className="chatbot-button"
          onClick={() => chatStoreService.cancel()}
        >
          Cancel
        </button>
      )}
    </Observer>
  );
}
