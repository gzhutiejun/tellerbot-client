import { Button } from "primereact/button";
import { myWorkerService } from "../services/work.service";
import Avatar from "./Avatar";
import Dialog from "./Dialog";
import Mic from "./Mic";

function App() {
  const startRecording = () => {
    myWorkerService.startRecording();
  };
  const stopRecording = () => {
    myWorkerService.stopRecording();
  };
  const disableAudio = () => {
    myWorkerService.disableAudio();
  };
  return (
    <div className={"acc-screen"}>
      <div className="acc-header">
        <div className="acc-logo"></div>
      </div>

      <div className="acc-body">
        <div className="avatar">
          <Avatar></Avatar>
        </div>

        <div className="dialog">
          <Dialog></Dialog>
    
        </div>
      </div>
    </div>
  );
}

export default App;
