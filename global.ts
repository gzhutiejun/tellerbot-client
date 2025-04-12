declare global {
  interface Window {
    createAudioRecorder: (silenceTimeout: number, onStopRecordingCallback: (blob: Blob) => void) => () => void;
  }
}
