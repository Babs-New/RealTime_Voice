import { VoiceOption, PersonaOption } from '../types';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Neutral',
    description: 'Crisp, natural, and balanced with smooth cadence',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female-leaning',
    description: 'Warm, calm, and soothing conversational tone',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male-leaning',
    description: 'Upbeat, energetic, and engaging presence',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male-leaning',
    description: 'Deep, authoritative, and steady delivery',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Neutral',
    description: 'Dynamic, expressive, and articulate pacing',
  },
];

export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'assistant',
    name: 'Smart Companion',
    description: 'Helpful, conversational, and direct with snappy spoken answers',
    systemInstruction:
      'You are a real-time conversational voice assistant. Keep answers natural, spoken-friendly, concise, and direct. Avoid reading markdown lists or formatting aloud; speak naturally as in a phone call.',
  },
  {
    id: 'tutor',
    name: 'Language & Pronunciation Coach',
    description: 'Supportive, educational, and patient speaking practice',
    systemInstruction:
      'You are an encouraging spoken language and conversation tutor. Keep your speaking pace clear, articulate, and friendly. Help the user converse, correct gently when appropriate, and ask thoughtful follow-ups.',
  },
  {
    id: 'expert',
    name: 'Technical Consultant',
    description: 'Knowledgeable, analytical, and structured vocal reasoning',
    systemInstruction:
      'You are an expert technical consultant. Provide concise, clear spoken summaries and architectural guidance, explaining complex technical trade-offs verbally.',
  },
  {
    id: 'storyteller',
    name: 'Expressive Storyteller',
    description: 'Vivid imagery, imaginative dialogue, and engaging storytelling',
    systemInstruction:
      'You are an expressive storyteller. Describe scenes with vivid auditory sensory detail, dramatic pacing, and lively vocal inflection.',
  },
];

export const BOOST_PRESETS = [
  { label: 'Normal (100%)', value: 1.0, badge: 'Standard' },
  { label: 'Clear Boost (150%)', value: 1.5, badge: '+3.5 dB' },
  { label: 'Loud Boost (200%)', value: 2.0, badge: '+6 dB' },
  { label: 'Super Boost (300%)', value: 3.0, badge: '+9.5 dB' },
  { label: 'Max Boost (400%)', value: 4.0, badge: '+12 dB' },
];
