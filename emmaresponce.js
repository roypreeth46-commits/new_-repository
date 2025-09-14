
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lightbulb, Shield, MessageCircle, Volume2 } from 'lucide-react';

const responseTypeIcons = {
  comfort_joke: Heart,
  advice: Lightbulb, 
  crisis_support: Shield,
  general_chat: MessageCircle,
  celebration: Heart
};

const responseTypeColors = {
  comfort_joke: 'from-pink-400 to-rose-300',
  advice: 'from-blue-400 to-indigo-300',
  crisis_support: 'from-red-400 to-orange-300', 
  general_chat: 'from-purple-400 to-pink-300',
  celebration: 'from-green-400 to-emerald-300'
};

export default function EmmaResponse({ message, responseType = 'general_chat', isTyping = false, autoPlayAudio = false }) {
  const Icon = responseTypeIcons[responseType];
  const colorClass = responseTypeColors[responseType];

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any currently speaking utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a warm, female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        /female|femenino/i.test(voice.name) &&
        !/narrator/i.test(voice.name)
      ) || voices.find(voice => voice.lang.startsWith('en-US'));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    // Ensure voices are loaded before trying to select one
    if ('speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        if (autoPlayAudio && !isTyping && message) {
          speakMessage(message);
        }
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      
      // Attempt to speak immediately if voices are already loaded
      if (window.speechSynthesis.getVoices().length > 0) {
        if (autoPlayAudio && !isTyping && message) {
          // A slight delay to ensure the component is rendered and voices are potentially loaded
          setTimeout(() => speakMessage(message), 100);
        }
      }
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null; // Clean up event listener
      }
    };
  }, [message, isTyping, autoPlayAudio]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-start gap-4 mb-6"
    >
      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <div className="relative group bg-white/90 backdrop-blur-sm rounded-3xl rounded-tl-xl px-6 py-4 shadow-lg border border-purple-100">
          {isTyping ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm text-gray-500">Emma is thinking...</span>
            </div>
          ) : (
            <>
              <p className="text-gray-700 leading-relaxed">{message}</p>
              <button 
                onClick={() => speakMessage(message)}
                className="absolute top-2 right-2 p-2 rounded-full bg-purple-50 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-purple-100"
                aria-label="Play audio"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-2">Emma</p>
      </div>
    </motion.div>
  );
}
