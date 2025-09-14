
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@/entities/User';
import { UserProfile } from '@/entities/UserProfile';
import { Conversation } from '@/entities/Conversation';
import { MoodEntry } from '@/entities/MoodEntry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import EmmaResponse from '../components/chat/EmmaResponse';
import UserMessage from '../components/chat/UserMessage';
import { EmmaPersonality } from '../components/chat/EmmaPersonality';
import EmotionSelector from '../components/chat/EmotionSelector';

export default function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEmmaTyping, setIsEmmaTyping] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const messagesEndRef = useRef(null);
  const emmaPersonality = useRef(null);

  const getWelcomeMessage = useCallback((profile) => {
    const nickname = profile.nickname || 'dear';
    const welcomeMessages = [
      `Hello ${nickname}! I'm Emma, and I'm so happy to meet you. I'm here to listen, support, and chat with you whenever you need. How are you feeling today?`,
      `Hi there, ${nickname}! It's wonderful to connect with you. Think of me as your caring companion who's always here to listen. What's on your mind?`,
      `Welcome ${nickname}! I'm Emma, and I'm here to be your supportive friend. Whether you need encouragement, a laugh, or just someone to talk to, I'm here for you. How has your day been?`
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
  
        // Get or create user profile
        const profiles = await UserProfile.filter({ created_by: currentUser.email });
        let profile = profiles[0];
  
        if (!profile || !profile.onboarding_completed) {
          // Redirect to onboarding if not completed
          navigate(createPageUrl('Onboarding'));
          return;
        }
  
        setUserProfile(profile);
        setAutoPlayAudio(profile.auto_play_audio !== false); // Default to true if undefined
        emmaPersonality.current = new EmmaPersonality(profile);
  
        // Load recent conversation history
        const recentConversations = await Conversation.filter(
          { created_by: currentUser.email },
          '-created_date',
          20
        );
        
        if (recentConversations.length === 0) {
          // First conversation - Emma introduces herself
          const welcomeMessage = getWelcomeMessage(profile);
          setMessages([{
            type: 'emma',
            content: welcomeMessage,
            responseType: 'general_chat',
            timestamp: new Date()
          }]);
        } else {
          // Load previous messages
          const formattedMessages = recentConversations.reverse().flatMap(conv => [
            {
              type: 'user',
              content: conv.user_message,
              timestamp: new Date(conv.created_date)
            },
            {
              type: 'emma', 
              content: conv.emma_response,
              responseType: conv.response_type,
              timestamp: new Date(conv.created_date)
            }
          ]);
          setMessages(formattedMessages.slice(-20)); // Keep last 20 messages
        }
  
      } catch (error) {
        console.error('Error initializing chat:', error);
        navigate(createPageUrl('Onboarding'));
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [navigate, getWelcomeMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isEmmaTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to handle emotion selection from EmotionSelector
  const handleEmotionSelect = (emotionId) => {
    setCurrentEmotion(emotionId);
    // Pre-fill message input based on emotion with more emotional specificity
    const emotionMessages = {
      happy: "I'm feeling really joyful and wanted to share this happiness with you!",
      excited: "I'm buzzing with excitement and positive energy right now!",
      neutral: "I'm feeling pretty balanced today, just wanted to check in with you",
      sad: "I'm feeling really sad and down right now, could use some emotional support",
      stressed: "I'm feeling overwhelmed and emotionally drained, everything feels like too much"
    };
    
    if (emotionMessages[emotionId]) {
      setNewMessage(emotionMessages[emotionId]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isEmmaTyping) return;

    const userMsg = newMessage.trim();
    setNewMessage('');

    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: userMsg,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Show Emma typing
    setIsEmmaTyping(true);

    try {
      // Detect emotion with enhanced sensitivity
      const detectedEmotion = emmaPersonality.current.detectEmotion(userMsg);
      
      // Update current emotion based on detected emotion with more nuanced mapping
      const emotionMapping = {
        'anxious': 'stressed',
        'angry': 'stressed', // Map anger to stressed for UI simplicity
        'lonely': 'sad'     // Map loneliness to sad for UI simplicity
      };
      
      setCurrentEmotion(emotionMapping[detectedEmotion] || detectedEmotion);
      
      const { response, responseType } = await emmaPersonality.current.generateResponse(
        userMsg, 
        detectedEmotion,
        messages
      );

      // Add Emma's response
      const emmaMessage = {
        type: 'emma',
        content: response,
        responseType,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, emmaMessage]);
        setIsEmmaTyping(false);
      }, 1500 + Math.random() * 1500); // Slightly longer for more thoughtful responses

      // Save conversation to database
      await Conversation.create({
        user_message: userMsg,
        emma_response: response,
        detected_emotion: detectedEmotion,
        response_type: responseType,
        session_id: sessionId
      });

      // Auto-create mood entry with more nuanced scoring
      if (detectedEmotion !== 'neutral') {
        const moodScore = getMoodScore(detectedEmotion);
        await MoodEntry.create({
          mood_score: moodScore,
          primary_emotion: detectedEmotion,
          notes: userMsg.length > 50 ? userMsg.substring(0, 50) + '...' : userMsg,
          checkin_type: 'conversation'
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'emma',
        content: "I can sense something important in what you're sharing, but I'm having trouble connecting right now. Your emotions still matter to me. Please try again in a moment. 💙",
        responseType: 'general_chat',
        timestamp: new Date()
      }]);
      setIsEmmaTyping(false);
    }
  };

  const getMoodScore = (emotion) => {
    const emotionScores = {
      happy: 8,
      excited: 9,
      neutral: 5,
      sad: 3,
      stressed: 3,
      anxious: 2, // Added anxious
      angry: 2,
      lonely: 2,
      crisis: 1
    };
    return emotionScores[emotion] || 5;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Emma is getting ready to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Chat header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Chat with Emma</h1>
            <p className="text-sm text-gray-500">Your caring AI companion</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              message.type === 'user' ? (
                <UserMessage key={index} message={message.content} />
              ) : (
                <EmmaResponse 
                  key={index}
                  message={message.content}
                  responseType={message.responseType}
                  autoPlayAudio={autoPlayAudio}
                />
              )
            ))}
          </AnimatePresence>
          
          {isEmmaTyping && (
            <EmmaResponse 
              message=""
              responseType="general_chat"
              isTyping={true}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-purple-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Emotion selector */}
          <EmotionSelector 
            currentEmotion={currentEmotion}
            onEmotionSelect={handleEmotionSelect}
          />

          {/* Quick message buttons */}
          <div className="flex items-center justify-center mt-3 gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-purple-600 transition-colors"
              onClick={() => setNewMessage("I'm having a really difficult emotional day and need someone to understand")}
            >
              <Smile className="w-4 h-4 mr-2" />
              Need emotional support
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-purple-600 transition-colors"
              onClick={() => setNewMessage("I'm feeling emotionally overwhelmed and don't know how to cope")}
            >
              <Heart className="w-4 h-4 mr-2" />
              Need emotional guidance
            </Button>
          </div>
          
          <div className="flex gap-3 items-end mt-3">
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share what's on your mind..."
                className="w-full bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-2xl px-4 py-3 text-gray-700"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isEmmaTyping}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isEmmaTyping}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl px-6 py-3 shadow-lg transition-all duration-300"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
