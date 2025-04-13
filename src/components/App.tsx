import Avatar from "./Avatar";
import CustomerChatPanel from "./CustomerChatPanel";
import Mic from "./Mic";
import { Observer } from "mobx-react-lite";
import AudioPlayer from "./AudioPlayer";
import StartChatButton from "./StartChatButton";
import AgentChatPanel from "./AgentChatPanel";
import CancelButton from "./CancelButton";

function App() {
  return (
    <Observer>
      {() => (
        <div>
          <div className={"acc-screen"}>
            <div className="acc-header">
              <div className="acc-logo"></div>
            </div>

            <div className="acc-body">
              <div className="avatar">
                <Avatar></Avatar>
              </div>

              <div className="dialog">
                <AgentChatPanel></AgentChatPanel>
                <CustomerChatPanel></CustomerChatPanel>

                <Mic></Mic>

                <div className="button-container">
                  <StartChatButton></StartChatButton>
                  <CancelButton></CancelButton>
                </div>

                <AudioPlayer></AudioPlayer>
              </div>
            </div>
          </div>
        </div>
      )}
    </Observer>
  );
}

export default App;
