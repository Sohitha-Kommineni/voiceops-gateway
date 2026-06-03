import { describe, expect, it } from "vitest";

import { base64ToPcm16, floatToPcm16, muLawToLinear, pcm16ToBase64 } from "./audioCodecs";

describe("audio codecs", () => {
  it("converts float samples to pcm16 and base64", () => {
    const pcm = floatToPcm16(new Float32Array([-1, 0, 1]));
    expect(pcm[0]).toBeLessThan(0);
    const decoded = base64ToPcm16(pcm16ToBase64(pcm));
    expect(decoded.length).toBe(3);
  });

  it("decodes mu-law values", () => {
    expect(typeof muLawToLinear(255)).toBe("number");
  });
});
