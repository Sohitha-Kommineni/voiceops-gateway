import array
import math


def silence_pcm16(duration_ms: int, sample_rate: int = 24000) -> bytes:
    samples = int(sample_rate * (duration_ms / 1000))
    return b"\x00\x00" * samples


def tone_pcm16(duration_ms: int, sample_rate: int = 24000, frequency: int = 440) -> bytes:
    samples = int(sample_rate * (duration_ms / 1000))
    out = array.array("h")
    for i in range(samples):
        out.append(int(math.sin(2 * math.pi * frequency * i / sample_rate) * 6000))
    return out.tobytes()
