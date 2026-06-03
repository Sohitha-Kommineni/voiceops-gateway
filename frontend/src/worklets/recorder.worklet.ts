class VoiceOpsRecorderProcessor extends AudioWorkletProcessor {
  private muted = false;
  private sequence = 0;

  process(inputs: Float32Array[][]): boolean {
    const input = inputs[0]?.[0];
    if (!input) return true;
    let sum = 0;
    for (const sample of input) sum += sample * sample;
    const level = Math.sqrt(sum / Math.max(input.length, 1));
    this.port.postMessage({
      type: "level",
      level
    });
    if (!this.muted) {
      this.port.postMessage({
        type: "audio",
        sequence: this.sequence++,
        samples: input.slice(0)
      });
    }
    return true;
  }

  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data?.type === "mute") this.muted = Boolean(event.data.value);
    };
  }
}

registerProcessor("voiceops-recorder", VoiceOpsRecorderProcessor);

export {};
