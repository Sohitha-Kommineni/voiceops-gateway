import { base64ToPcm16 } from "./audioCodecs";

export function createAudioBufferFromPcm16(context: AudioContext, payload: string, sampleRate: number): AudioBuffer {
  const pcm = base64ToPcm16(payload);
  const buffer = context.createBuffer(1, pcm.length, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm.length; i += 1) channel[i] = pcm[i] / 32768;
  return buffer;
}
