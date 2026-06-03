import { TranscriptPanel } from "./TranscriptPanel";

export function AssistantPanel({ text }: { text: string }) {
  return <TranscriptPanel title="Assistant Transcript Stream" text={text} />;
}
