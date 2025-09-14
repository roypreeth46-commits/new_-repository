
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { UserProfile } from '@/entities/UserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Heart, Save, Bell, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const SUPPORT_TYPES = [
  { id: 'motivation', label: 'Daily motivation & encouragement', icon: '💪' },
  { id: 'stress_relief', label: 'Stress relief & calming support', icon: '🧘' },
  { id: 'jokes', label: 'Humor & light-hearted moments', icon: '😄' },
  { id: 'reflection', label: 'Thoughtful reflection & journaling', icon: '📝' },
  { id: 'advice', label: 'Practical life advice', icon: '💡' }
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    nickname: '',
    age_group: '',
    preferred_support_type: [],
    daily_checkin_time: '09:00',
    auto_play_audio: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        const profiles = await UserProfile.filter({ created_by: currentUser.email });
        const profile = profiles[0];
        
        if (profile) {
          setUserProfile(profile);
          setFormData({
            nickname: profile.nickname || '',
            age_group: profile.age_group || '',
            preferred_support_type: profile.preferred_support_type || [],
            daily_checkin_time: profile.daily_checkin_time || '09:00',
            auto_play_audio: profile.auto_play_audio !== false // Default to true if undefined or null
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userProfile?.id]); // Rerun if userProfile ID changes (e.g., on first load)

  const handleSupportTypeChange = (supportId, checked) => {
    setFormData(prev => ({
      ...prev,
      preferred_support_type: checked 
        ? [...prev.preferred_support_type, supportId]
        : prev.preferred_support_type.filter(id => id !== supportId)
    }));
  };

  const saveSettings = async () => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      await UserProfile.update(userProfile.id, formData);
      // Show success feedback
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-600">Customize your experience with Emma</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <UserIcon className="w-5 h-5 text-purple-500" />
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nickname" className="text-gray-700 font-medium">
                      Preferred Name
                    </Label>
                    <Input
                      id="nickname"
                      placeholder="What should Emma call you?"
                      value={formData.nickname}
                      onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                      className="mt-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="age_group" className="text-gray-700 font-medium">
                      Age Group
                    </Label>
                    <Select 
                      value={formData.age_group} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, age_group: value }))}
                    >
                      <SelectTrigger className="mt-2 border-purple-200 focus:border-purple-400">
                        <SelectValue placeholder="Select your age group..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teen">Teen (13-19)</SelectItem>
                        <SelectItem value="adult">Young Adult (20-39)</SelectItem>
                        <SelectItem value="midlife">Midlife (40-59)</SelectItem>
                        <SelectItem value="senior">Senior (60+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="checkin_time" className="text-gray-700 font-medium">
                    Daily Check-in Time
                  </Label>
                  <Input
                    id="checkin_time"
                    type="time"
                    value={formData.daily_checkin_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, daily_checkin_time: e.target.value }))}
                    className="mt-2 w-48 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Emma will send you a gentle check-in at this time each day
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Support Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-pink-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Support Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Choose the types of support you'd like from Emma:</p>
                  {SUPPORT_TYPES.map((type) => (
                    <div key={type.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-colors">
                      <Checkbox
                        id={`settings-${type.id}`}
                        checked={formData.preferred_support_type.includes(type.id)}
                        onCheckedChange={(checked) => handleSupportTypeChange(type.id, checked)}
                        className="mt-1 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`settings-${type.id}`} className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                          <span className="text-lg">{type.icon}</span>
                          {type.label}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Voice & Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Bell className="w-5 h-5 text-green-500" />
                  Voice & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-700">Auto-Play Voice</p>
                      <p className="text-sm text-gray-500">Automatically play Emma's responses out loud</p>
                    </div>
                    <Switch
                      checked={formData.auto_play_audio}
                      onCheckedChange={(checked) => setFormData(prev => ({...prev, auto_play_audio: checked}))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-700">Daily Check-ins</p>
                      <p className="text-sm text-gray-500">Receive gentle reminders from Emma</p>
                    </div>
                    <Switch
                      checked={enableNotifications}
                      onCheckedChange={setEnableNotifications}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-3"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
