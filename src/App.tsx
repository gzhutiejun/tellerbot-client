import { Button } from "primereact/button";
import { myWorkerService } from "./services/work.service";

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
    <div>
      <Button label="Start Recording" icon="pi pi-check" onClick={startRecording} />
      <Button label="Stop Recording" icon="pi pi-check" onClick={stopRecording} />
      <Button label="Disable Audio" icon="pi pi-check" onClick={disableAudio} />
    </div>
  );
}

export default App;
