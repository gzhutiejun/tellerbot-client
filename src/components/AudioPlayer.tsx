import { Observer } from "mobx-react-lite";
import { chatStoreService } from "../services/chat-store.service";
import { If } from "./if";

export default function AudioPlayer() {
  return (
    <Observer>
      {() => (
        <If condition={!!chatStoreService.audioUrl}>
          <audio
            id="audio"
            src={chatStoreService.audioUrl}
            controls
            autoPlay
            style={{ display: "none" }}
          ></audio>
        </If>
      )}
    </Observer>
  );
}
