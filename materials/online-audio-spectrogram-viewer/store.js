const store = {
    state: {
        background: '#eee',
        isRecording: false,
        recordingOptions: {
            videoBps: 8000000,
            audioBps: 128000
        }
    },
    setBackgroundRecording() {
        this.state.background = '#faa';
        this.state.isRecording = true;
    },
    setBackgroundNormal() {
        this.state.background = '#eee';
        this.state.isRecording = false;
    },
    setRecordingOptions(options) {
        this.state.recordingOptions = options;
    }
};