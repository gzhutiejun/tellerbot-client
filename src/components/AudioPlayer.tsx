import { Observer } from "mobx-react-lite";
import { chatStoreService } from "../services/chat-store.service";
import { If } from "./if";

export default function AudioPlayer() {                                       
  const handleEnded = () => {
    console.log("handleComplete");
    chatStoreService.setAudioPlayComplete();
  };
  return (
    <Observer>
      {() => (
        <If condition={!!chatStoreService.audioUrl}>
          <audio
            id="audio"
            onEnded={handleEnded}
            src={chatStoreService.audioUrl}
            controls
            autoPlay = {true}
            style={{ display: "none" }}
          ></audio>
        </If>
      )}
    </Observer>
  );
}
