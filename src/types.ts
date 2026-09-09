export type VoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'Female-leaning' | 'Male-leaning' | 'Neutral';
  description: string;
}

export interface PersonaOption {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
}

export interface TranscriptItem {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  isLive?: boolean;
}

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export type AgentAudioState = 'idle' | 'listening' | 'speaking' | 'processing';

export interface AudioSettings {
  outputVolume: number; // 0 to 4 (400% boost)
  inputGain: number; // 0.5 to 3 (300% gain)
  boostEnabled: boolean;
  limiterActive: boolean;
}
