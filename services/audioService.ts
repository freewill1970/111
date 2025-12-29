
/**
 * Utility for handling raw PCM audio from Gemini TTS
 * Following the Google GenAI Coding Guidelines
 */

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let currentSource: AudioBufferSourceNode | null = null;
let audioContext: AudioContext | null = null;

export async function playRawPcm(base64Data: string): Promise<void> {
  // Stop existing playback
  stopPlayback();

  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  // Browser security requires resuming the context after a user gesture.
  // Although the button click is a gesture, if the TTS generation takes time,
  // the context might be in 'suspended' state.
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const bytes = decodeBase64(base64Data);
  const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  
  currentSource = source;
  
  return new Promise((resolve) => {
    source.onended = () => {
      if (currentSource === source) {
        currentSource = null;
      }
      resolve();
    };
    source.start();
  });
}

export function stopPlayback() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Already stopped
    }
    currentSource = null;
  }
}
