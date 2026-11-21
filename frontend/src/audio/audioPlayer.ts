/**
 * Audio Player for Trivaani
 * Plays Gemini Live API 24 kHz 16-bit linear PCM audio chunks sequentially
 * without jitter or gaps.
 */

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.initContext();
  }

  private initContext(): void {
    if (this.isInitialized) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 24000 });
    this.nextPlayTime = this.audioContext.currentTime;
    this.isInitialized = true;
  }

  async playChunk(base64PCM24: string): Promise<void> {
    if (!this.audioContext) {
      this.initContext();
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    if (!this.audioContext) return;

    const binaryString = window.atob(base64PCM24);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;
  }

  stop(): void {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}
