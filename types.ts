
export interface MeditationSession {
  script: string;
  visualTheme: string;
  imageUrl: string;
  audioData: string; // base64 encoded
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}
