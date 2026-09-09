/**
 * Audio processing utilities for Gemini Live API
 * - 16kHz PCM streaming for input
 * - 24kHz PCM playback for output
 * - High-gain Volume Booster (up to 400% / +12dB) with dynamics compressor / limiter
 */

/**
 * Resamples a Float32Array audio buffer from sourceRate to targetRate (16000)
 */
export function downsampleBuffer(
  buffer: Float32Array,
  sourceRate: number,
  targetRate = 16000
): Float32Array {
  if (sourceRate === targetRate) {
    return buffer;
  }
  const ratio = sourceRate / targetRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/**
 * Converts Float32Array [-1, 1] into 16-bit PCM ArrayBuffer (little-endian)
 */
export function float32ToPcm16(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1.0, 1.0]
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to signed 16-bit PCM integer
    const pcm = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, pcm, true); // little-endian
  }
  return buffer;
}

/**
 * Encodes an ArrayBuffer or Uint8Array to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string containing 16-bit signed PCM little-endian audio
 * and creates an AudioBuffer at 24kHz.
 */
export function decodePcm24kToAudioBuffer(
  audioCtx: AudioContext,
  base64Pcm: string
): AudioBuffer {
  const binaryString = atob(base64Pcm);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numSamples = Math.floor(bytes.byteLength / 2);
  const float32Samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true); // little-endian
    // Normalize to [-1.0, 1.0]
    float32Samples[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }

  const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
  audioBuffer.copyToChannel(float32Samples, 0);
  return audioBuffer;
}

/**
 * Calculates the Root-Mean-Square (RMS) amplitude from a Float32Array or Uint8Array
 */
export function calculateRms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Converts linear volume [0..1] or above to approximate decibels [dB]
 */
export function linearToDb(val: number): number {
  if (val <= 0.0001) return -60;
  return Math.max(-60, 20 * Math.log10(val));
}
