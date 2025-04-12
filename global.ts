declare global {
  interface Window {
    RecordRTC: unknown;
    createAudioRecorder: (silenceTimeout: number, onStopRecordingCallback: (blob: Blob) => void) => () => void;
  }
}
