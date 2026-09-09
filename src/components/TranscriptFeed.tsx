import React, { useRef, useEffect, useState } from 'react';
import { TranscriptItem, ConnectionState } from '../types';
import {
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Send,
  Sparkles,
  User,
  Bot,
  Info,
} from 'lucide-react';

interface TranscriptFeedProps {
  transcripts: TranscriptItem[];
  connectionState: ConnectionState;
  onSendMessage: (text: string) => void;
  onClear: () => void;
}

export const TranscriptFeed: React.FC<TranscriptFeedProps> = ({
  transcripts,
  connectionState,
  onSendMessage,
  onClear,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isConnected = connectionState === 'connected';

  // Auto-scroll to bottom on new transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = () => {
    const fullText = transcripts
      .map((t) => `[${t.timestamp}] ${t.role.toUpperCase()}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="transcript-feed-container"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col h-[480px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Live Speech Transcript
          </h3>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {transcripts.filter((t) => t.role !== 'system').length} turns
          </span>
        </div>

        <div className="flex items-center gap-2">
          {transcripts.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                title="Copy conversation transcript"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClear}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Clear transcript history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript Items Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-sm scroll-smooth"
      >
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Bot className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-500 max-w-xs">
              Spoken conversation turns and model transcriptions will appear here in real time.
            </p>
          </div>
        ) : (
          transcripts.map((item) => {
            if (item.role === 'system') {
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-center gap-2 my-2 text-[11px] text-slate-600 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>{item.text}</span>
                  <span>• {item.timestamp}</span>
                </div>
              );
            }

            const isUser = item.role === 'user';

            return (
              <div
                key={item.id}
                className={`flex items-start gap-2.5 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-50 text-blue-950 border border-blue-200/80 rounded-tr-none'
                      : 'bg-slate-100 text-slate-900 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-600 font-medium mb-1">
                    <span>{isUser ? 'You' : 'Gemini Voice'}</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{item.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Fallback Text Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          id="transcript-text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={!isConnected}
          placeholder={
            isConnected
              ? 'Type a message to Gemini Live (or speak)...'
              : 'Connect voice session to send text prompt...'
          }
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          id="send-text-message-button"
          disabled={!isConnected || !inputText.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          title="Send text prompt"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
