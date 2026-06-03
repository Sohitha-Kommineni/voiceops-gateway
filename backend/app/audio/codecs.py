from app.audio.mulaw import linear_to_mulaw, mulaw_to_linear


def pcm16_to_mulaw(pcm: bytes) -> bytes:
    out = bytearray()
    for i in range(0, len(pcm), 2):
        sample = int.from_bytes(pcm[i : i + 2], "little", signed=True)
        out.append(linear_to_mulaw(sample))
    return bytes(out)


def mulaw_to_pcm16(data: bytes) -> bytes:
    out = bytearray()
    for value in data:
        out.extend(mulaw_to_linear(value).to_bytes(2, "little", signed=True))
    return bytes(out)
