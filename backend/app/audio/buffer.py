from collections import deque


class AudioBuffer:
    def __init__(self, max_frames: int = 100):
        self.frames: deque[bytes] = deque(maxlen=max_frames)

    def append(self, frame: bytes) -> None:
        self.frames.append(frame)

    def clear(self) -> None:
        self.frames.clear()

    @property
    def depth_bytes(self) -> int:
        return sum(len(frame) for frame in self.frames)
