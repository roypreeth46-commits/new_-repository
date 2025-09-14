import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { MoodEntry } from '@/entities/MoodEntry';
import { Conversation } from '@/entities/Conversation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, MessageCircle, Heart, Smile } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';

const EMOTION_COLORS = {
  happy: '#68D391',
  excited: '#9AE6B4', 
  neutral: '#A0AEC0',
  sad: '#63B3ED',
  stressed: '#F6AD55',
  angry: '#FC8181',
  lonely: '#B794F6',
  overwhelmed: '#F687B3',
  peaceful: '#4FD1C7'
};

const EMOTION_EMOJIS = {
  happy: '😊',
  excited: '🤩',
  neutral: '😐',
  sad: '😢',
  stressed: '😰',
  angry: '😠', 
  lonely: '😔',
  overwhelmed: '😵',
  peaceful: '😌'
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [moodEntries, setMoodEntries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [emotionCounts, setEmotionCounts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load mood entries from the last 30 days
      const moods = await MoodEntry.filter(
        { created_by: currentUser.email },
        '-created_date',
        30
      );
      setMoodEntries(moods);

      // Load conversations
      const convos = await Conversation.filter(
        { created_by: currentUser.email },
        '-created_date',
        50
      );
      setConversations(convos);

      // Process weekly mood data
      const weekData = generateWeeklyData(moods);
      setWeeklyData(weekData);

      // Process emotion frequency data
      const emotionData = generateEmotionData(moods);
      setEmotionCounts(emotionData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyData = (moods) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i));
      const dayMoods = moods.filter(mood => {
        const moodDate = startOfDay(new Date(mood.created_date));
        return moodDate.getTime() === date.getTime();
      });

      const avgMood = dayMoods.length > 0 
        ? dayMoods.reduce((sum, mood) => sum + mood.mood_score, 0) / dayMoods.length 
        : 0;

      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        mood: Math.round(avgMood * 10) / 10,
        count: dayMoods.length
      };
    });

    return last7Days;
  };

  const generateEmotionData = (moods) => {
    const emotionCounts = {};
    moods.forEach(mood => {
      emotionCounts[mood.primary_emotion] = (emotionCounts[mood.primary_emotion] || 0) + 1;
    });

    return Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        color: EMOTION_COLORS[emotion] || '#A0AEC0',
        emoji: EMOTION_EMOJIS[emotion] || '😐'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getRecentStats = () => {
    const last7Days = moodEntries.filter(mood => {
      const moodDate = new Date(mood.created_date);
      return moodDate > subDays(new Date(), 7);
    });

    const avgMood = last7Days.length > 0
      ? last7Days.reduce((sum, mood) => sum + mood.mood_score, 0) / last7Days.length
      : 0;

    const totalConversations = conversations.length;
    const last7DayConversations = conversations.filter(conv => {
      const convDate = new Date(conv.created_date);
      return convDate > subDays(new Date(), 7);
    });

    return {
      avgMoodThis7Days: Math.round(avgMood * 10) / 10,
      totalConversations,
      conversationsThis7Days: last7DayConversations.length,
      totalMoodEntries: moodEntries.length
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  const stats = getRecentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
            Your Emotional Journey
          </h1>
          <p className="text-gray-600">Track your moods and see patterns with Emma's support</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-purple-100 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Average Mood (7 days)</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.avgMoodThis7Days}/10</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl">
                    <Smile className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-pink-100 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chats with Emma</p>
                    <p className="text-2xl font-bold text-pink-600">{stats.totalConversations}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-green-100 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recent Activity</p>
                    <p className="text-2xl font-bold text-green-600">{stats.conversationsThis7Days} this week</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mood Entries</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalMoodEntries}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mood Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Mood Trends (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6B7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6B7280" 
                        fontSize={12}
                        domain={[0, 10]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="url(#moodGradient)" 
                        strokeWidth={3}
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2, fill: '#FFFFFF' }}
                      />
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>Start tracking your mood to see trends here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Emotion Frequency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-pink-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Smile className="w-5 h-5 text-pink-500" />
                  Most Common Emotions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emotionCounts.length > 0 ? (
                  <div className="space-y-4">
                    {emotionCounts.map((item, index) => (
                      <div key={item.emotion} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-700 capitalize">
                              {item.emotion.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r"
                            style={{ 
                              width: `${Math.max(20, (item.count / Math.max(...emotionCounts.map(e => e.count))) * 60)}px`,
                              backgroundColor: item.color 
                            }}
                          />
                          <span className="text-sm font-semibold text-gray-600">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Smile className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Chat with Emma to track your emotions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}