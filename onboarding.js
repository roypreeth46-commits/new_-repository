import React, { useState } from 'react';
import { User } from '@/entities/User';
import { UserProfile } from '@/entities/UserProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SUPPORT_TYPES = [
  { id: 'motivation', label: 'Daily motivation & encouragement', icon: '💪' },
  { id: 'stress_relief', label: 'Stress relief & calming support', icon: '🧘' },
  { id: 'jokes', label: 'Humor & light-hearted moments', icon: '😄' },
  { id: 'reflection', label: 'Thoughtful reflection & journaling', icon: '📝' },
  { id: 'advice', label: 'Practical life advice', icon: '💡' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: '',
    age_group: '',
    preferred_support_type: [],
    daily_checkin_time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSupportTypeChange = (supportId, checked) => {
    setFormData(prev => ({
      ...prev,
      preferred_support_type: checked 
        ? [...prev.preferred_support_type, supportId]
        : prev.preferred_support_type.filter(id => id !== supportId)
    }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await UserProfile.create({
        ...formData,
        onboarding_completed: true
      });
      navigate(createPageUrl('Chat'));
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.nickname.trim() && formData.age_group;
      case 2:
        return formData.preferred_support_type.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Welcome to Emma
            </CardTitle>
            <p className="text-gray-600 mt-2">Let's personalize your caring companion</p>
            
            {/* Progress indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i <= step 
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Nice to meet you!</h3>
                  <p className="text-gray-600">Tell me a bit about yourself</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nickname" className="text-gray-700 font-medium">
                      What should I call you?
                    </Label>
                    <Input
                      id="nickname"
                      placeholder="Your preferred name..."
                      value={formData.nickname}
                      onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                      className="mt-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="age_group" className="text-gray-700 font-medium">
                      Which age group fits you best?
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Heart className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800">How can I support you?</h3>
                  <p className="text-gray-600">Choose the types of support you'd like from me</p>
                </div>

                <div className="space-y-4">
                  {SUPPORT_TYPES.map((type) => (
                    <div key={type.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-colors">
                      <Checkbox
                        id={type.id}
                        checked={formData.preferred_support_type.includes(type.id)}
                        onCheckedChange={(checked) => handleSupportTypeChange(type.id, checked)}
                        className="mt-1 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor={type.id} className="text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                          <span className="text-lg">{type.icon}</span>
                          {type.label}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-800">Almost ready!</h3>
                  <p className="text-gray-600">When would you like me to check in with you?</p>
                </div>

                <div>
                  <Label htmlFor="checkin_time" className="text-gray-700 font-medium">
                    Daily check-in time (optional)
                  </Label>
                  <Input
                    id="checkin_time"
                    type="time"
                    value={formData.daily_checkin_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, daily_checkin_time: e.target.value }))}
                    className="mt-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    I'll send you a gentle check-in message at this time each day
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-gray-800 mb-2">You're all set! 🎉</h4>
                  <p className="text-gray-600 text-sm">
                    I'm excited to be your caring companion. Remember, I'm here whenever you need support, 
                    encouragement, or just someone to talk to.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  Back
                </Button>
              )}
              
              <div className="ml-auto">
                {step < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isSubmitting ? 'Setting up...' : 'Start chatting with Emma!'}
                    <Heart className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}