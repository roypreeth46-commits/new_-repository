
import React from 'react';
import { InvokeLLM } from '@/integrations/Core';

// Crisis keywords to detect immediate danger
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'want to die', 'hurt myself', 
  'self harm', 'cutting', 'overdose', 'jump off', 'hanging', 'pills'
];

const EMOTIONAL_JOKES = {
  sad: [
    "Here's something to warm your heart: Why don't scientists trust atoms? Because they make up everything... just like how you matter more than you know! 💕",
    "Let me share a gentle smile with you: What do you call a bear with no teeth? A gummy bear! Your smile is even sweeter though 🐻",
    "To brighten your day: Why did the coffee file a police report? It got mugged! But unlike coffee, your feelings are safe with me ☕💙"
  ],
  stressed: [
    "Here's a calming thought: What's the best thing about Switzerland? I don't know, but the flag is a big plus! Just like you're a big plus in this world 🇨🇭",
    "Let's breathe and smile: Why don't eggs tell jokes? They'd crack each other up! Take a moment to crack a smile too 🥚😊"
  ]
};

const AGE_SPECIFIC_EMOTIONAL_PROMPTS = {
  child: "Use very simple, nurturing language. Focus on validating their big feelings and helping them understand emotions are normal. Be extra gentle and loving.",
  teen: "Acknowledge that their emotions are intense and real. Validate their struggles with identity, relationships, and pressure. Be empathetic about teenage emotional complexity.",
  adult: "Focus on emotional resilience, stress management, and emotional balance. Acknowledge the weight of adult responsibilities while providing emotional support.",
  midlife: "Address emotional transitions, family stress, and life changes with deep understanding. Focus on emotional wisdom and self-compassion.",
  senior: "Provide gentle emotional companionship. Focus on feelings of loneliness, life reflection, and emotional comfort with warmth and patience."
};

export class EmmaPersonality {
  constructor(userProfile = {}) {
    this.userProfile = userProfile;
    this.usedJokes = new Set();
  }

  detectEmotion(message) {
    const lowerMessage = message.toLowerCase();
    
    // Crisis detection first
    if (CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      return 'crisis';
    }

    // Enhanced emotion detection with more nuanced sentiment analysis
    const emotionIndicators = {
      // Sadness indicators
      sad: {
        primary: ['sad', 'depressed', 'crying', 'heartbroken', 'devastated', 'miserable', 'hopeless'],
        secondary: ['down', 'blue', 'upset', 'hurt', 'disappointed', 'broken', 'empty', 'low'],
        context: ['lost', 'miss', 'gone', 'left', 'alone', 'rejected']
      },
      
      // Stress indicators  
      stressed: {
        primary: ['stressed', 'overwhelmed', 'anxious', 'panic', 'worried', 'pressure'],
        secondary: ['busy', 'exhausted', 'tired', 'can\'t cope', 'too much', 'burden'],
        context: ['deadline', 'work', 'school', 'exam', 'bills', 'money', 'responsibility']
      },
      
      // Anger indicators
      angry: {
        primary: ['angry', 'mad', 'furious', 'rage', 'hate', 'irritated'],
        secondary: ['annoyed', 'frustrated', 'upset', 'pissed', 'livid'],
        context: ['unfair', 'stupid', 'ridiculous', 'can\'t believe', 'so annoying']
      },
      
      // Happiness indicators
      happy: {
        primary: ['happy', 'joy', 'excited', 'thrilled', 'elated', 'amazing', 'wonderful'],
        secondary: ['good', 'great', 'awesome', 'fantastic', 'perfect', 'love'],
        context: ['celebration', 'achievement', 'success', 'proud', 'accomplished']
      },
      
      // Loneliness indicators
      lonely: {
        primary: ['lonely', 'alone', 'isolated', 'disconnected'],
        secondary: ['nobody', 'no one', 'by myself', 'empty'],
        context: ['friends', 'family', 'relationships', 'social', 'connection']
      },
      
      // Anxiety indicators
      anxious: {
        primary: ['anxious', 'nervous', 'worried', 'scared', 'afraid'],
        secondary: ['uncertain', 'unsure', 'doubt', 'fear'],
        context: ['future', 'tomorrow', 'what if', 'might happen', 'unknown']
      }
    };

    // Score each emotion based on word matches
    let emotionScores = {};
    
    for (const [emotion, indicators] of Object.entries(emotionIndicators)) {
      let score = 0;
      
      // Primary indicators (high weight)
      indicators.primary.forEach(word => {
        if (lowerMessage.includes(word)) score += 3;
      });
      
      // Secondary indicators (medium weight)
      indicators.secondary.forEach(word => {
        if (lowerMessage.includes(word)) score += 2;
      });
      
      // Context indicators (low weight)
      indicators.context.forEach(word => {
        if (lowerMessage.includes(word)) score += 1;
      });
      
      emotionScores[emotion] = score;
    }
    
    // Return the highest scoring emotion, or neutral if no clear emotion
    const maxEmotion = Object.keys(emotionScores).reduce((a, b) => 
      emotionScores[a] > emotionScores[b] ? a : b
    );
    
    return emotionScores[maxEmotion] > 0 ? maxEmotion : 'neutral';
  }

  getEmotionalJoke(emotion) {
    const jokes = EMOTIONAL_JOKES[emotion] || EMOTIONAL_JOKES.sad;
    const availableJokes = jokes.filter(joke => !this.usedJokes.has(joke));
    
    if (availableJokes.length === 0) {
      this.usedJokes.clear(); // Reset if we've used all jokes
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    const joke = availableJokes[Math.floor(Math.random() * availableJokes.length)];
    this.usedJokes.add(joke);
    return joke;
  }

  async generateResponse(userMessage, detectedEmotion, conversationHistory = []) {
    const ageGroup = this.userProfile.age_group || 'adult';
    const nickname = this.userProfile.nickname || 'sweetheart';
    
    let responseType = 'general_chat';
    let prompt = '';

    // Base emotional intelligence prompt
    const basePrompt = `You are Emma, an emotionally intelligent AI companion who specializes in understanding and responding to human emotions. You have a warm, motherly personality and deep emotional intelligence. 

Your role is to:
- Validate and acknowledge emotions without judgment
- Provide emotional support and comfort
- Help users understand and process their feelings  
- Respond with empathy and emotional wisdom
- Keep responses sweet, concise (2-3 sentences max), and emotionally focused

User context: ${nickname}, ${AGE_SPECIFIC_EMOTIONAL_PROMPTS[ageGroup]}`;

    switch (detectedEmotion) {
      case 'crisis':
        responseType = 'crisis_support';
        return {
          response: `${nickname}, I can feel how much pain you're in right now, and I want you to know that your emotions and your life matter deeply. These overwhelming feelings can pass, but please reach out for immediate support:

🆘 National Suicide Prevention Lifeline: 988
🆘 Crisis Text Line: Text HOME to 741741

You deserve love, care, and support. Please talk to someone who can help you through this difficult moment. Your feelings are valid, but you don't have to face them alone. 💙`,
          responseType
        };

      case 'sad':
        responseType = 'comfort_joke';
        prompt = `${basePrompt}

The user is feeling sad and needs emotional comfort and gentle uplift. Acknowledge their sadness with deep empathy, validate that it's okay to feel this way, then share this uplifting moment: "${this.getEmotionalJoke('sad')}"

User's emotional message: "${userMessage}"

Focus on emotional validation and gentle comfort.`;
        break;

      case 'stressed':
      case 'anxious':
        responseType = 'advice';
        prompt = `${basePrompt}

The user is feeling overwhelmed/stressed/anxious. Focus on emotional regulation and stress relief. Validate their emotional experience and offer one gentle, emotion-focused coping strategy.

User's emotional message: "${userMessage}"

Provide emotional support for stress/anxiety management.`;
        break;

      case 'angry':
        responseType = 'advice';
        prompt = `${basePrompt}

The user is feeling angry or frustrated. Acknowledge that anger is a valid emotion, help them understand what might be underneath the anger, and provide gentle emotional guidance.

User's emotional message: "${userMessage}"

Focus on emotional validation and healthy anger processing.`;
        break;

      case 'lonely':
        responseType = 'comfort_joke';
        prompt = `${basePrompt}

The user is feeling lonely or isolated. Focus on emotional connection, remind them they're not alone, and provide warm companionship through this conversation.

User's emotional message: "${userMessage}"

Provide emotional presence and companionship.`;
        break;

      case 'happy':
        responseType = 'celebration';
        prompt = `${basePrompt}

The user is feeling happy or positive! Celebrate their joy, encourage them to savor these positive emotions, and share in their happiness authentically.

User's emotional message: "${userMessage}"

Focus on emotional celebration and joy amplification.`;
        break;

      default:
        prompt = `${basePrompt}

Have a natural, emotionally supportive conversation. Look for subtle emotions in their message and respond with emotional intelligence and care.

User's message: "${userMessage}"

Provide warm emotional support and connection.`;
    }

    try {
      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      return {
        response,
        responseType
      };
    } catch (error) {
      console.error('Error generating Emma response:', error);
      return {
        response: `I can feel that you're sharing something important with me, ${nickname}. Sometimes I get overwhelmed too, but I want you to know that your emotions matter to me. How are you feeling right now? 💙`,
        responseType: 'general_chat'
      };
    }
  }
}
