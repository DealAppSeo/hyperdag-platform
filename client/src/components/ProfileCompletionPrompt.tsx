/**
 * Profile Completion Prompt Component
 * 
 * Shows users their activity progress and prompts them to complete their profile
 * before leaving to preserve their data and unlock rewards.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  User, 
  Shield, 
  Wallet, 
  Mail, 
  FileText, 
  Brain, 
  Users, 
  Gift,
  Clock,
  Save
} from 'lucide-react';

interface ActivitySummary {
  totalActivities: number;
  savedPurposes: number;
  pointsEarned: number;
  profileCompleteness: number;
  estimatedRewards: number;
}

interface ProfileCompletionPromptProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  activitySummary: ActivitySummary;
  promptReason: string;
  activityValue: number;
}

export function ProfileCompletionPrompt({ 
  open, 
  onClose, 
  onContinue, 
  activitySummary,
  promptReason,
  activityValue 
}: ProfileCompletionPromptProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      // Track the profile completion prompt interaction
      await fetch('/api/user-activity/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'profile_update',
          description: 'User prompted to complete profile before leaving',
          metadata: {
            activityValue,
            profileCompleteness: activitySummary.profileCompleteness,
            savedPurposes: activitySummary.savedPurposes
          }
        })
      });

      // Notify about activity preservation
      await fetch('/api/user-activity/notify-preserved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityCount: activitySummary.totalActivities
        })
      });

      toast({
        title: "Activity Preserved",
        description: `Your ${activitySummary.savedPurposes} saved items and ${activitySummary.totalActivities} activities are safely stored.`,
      });

      onContinue();
    } catch (error) {
      console.error('Error preserving activity:', error);
      toast({
        title: "Error",
        description: "Failed to preserve your activity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Save className="h-6 w-6 text-purple-600" />
            Don't Lose Your Progress!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Activity Summary */}
          <Alert className="border-purple-200 bg-purple-50">
            <Gift className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              {promptReason}
            </AlertDescription>
          </Alert>

          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {activitySummary.savedPurposes}
              </div>
              <div className="text-sm text-blue-700">Saved Items</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {activitySummary.totalActivities}
              </div>
              <div className="text-sm text-green-700">Activities</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {activitySummary.pointsEarned}
              </div>
              <div className="text-sm text-orange-700">Points Earned</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {activitySummary.estimatedRewards}
              </div>
              <div className="text-sm text-purple-700">Potential Rewards</div>
            </div>
          </div>

          {/* Profile Completion Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Completion</span>
              <Badge variant={activitySummary.profileCompleteness >= 70 ? 'default' : 'secondary'}>
                {activitySummary.profileCompleteness}%
              </Badge>
            </div>
            <Progress value={activitySummary.profileCompleteness} className="h-3" />
          </div>

          {/* Quick Profile Tasks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Complete Your Profile to Unlock:</h3>
            
            <div className="grid gap-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Shield className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Enable 2FA Security</div>
                  <div className="text-xs text-gray-600">Protect your saved items</div>
                </div>
                <Badge variant="outline">+10 pts</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Wallet className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Connect Web3 Wallet</div>
                  <div className="text-xs text-gray-600">Access DeFi features</div>
                </div>
                <Badge variant="outline">+15 pts</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Mail className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Verify Email</div>
                  <div className="text-xs text-gray-600">Get important updates</div>
                </div>
                <Badge variant="outline">+5 pts</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Brain className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Add Skills & Interests</div>
                  <div className="text-xs text-gray-600">Get AI recommendations</div>
                </div>
                <Badge variant="outline">+20 pts</Badge>
              </div>
            </div>
          </div>

          {/* Decentralized Storage Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your activity is automatically saved to decentralized storage. Complete your profile 
              to unlock the full value of your contributions and get personalized AI recommendations.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="flex-1"
              variant="outline"
            >
              {saving ? 'Saving...' : 'Save Progress & Continue Later'}
            </Button>
            
            <Link to="/profile" className="flex-1">
              <Button 
                onClick={onClose}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Complete Profile Now
              </Button>
            </Link>
          </div>

          {/* Quick Exit Option */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip for now (progress still saved)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage profile completion prompts
 */
export function useProfileCompletionPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    totalActivities: 0,
    savedPurposes: 0,
    pointsEarned: 0,
    profileCompleteness: 0,
    estimatedRewards: 0
  });
  const [promptReason, setPromptReason] = useState('');
  const [activityValue, setActivityValue] = useState(0);

  const checkPromptStatus = async () => {
    try {
      const [promptResponse, summaryResponse] = await Promise.all([
        fetch('/api/user-activity/completion-prompt'),
        fetch('/api/user-activity/summary')
      ]);

      if (promptResponse.ok && summaryResponse.ok) {
        const promptData = await promptResponse.json();
        const summaryData = await summaryResponse.json();

        if (promptData.success && promptData.data.shouldPrompt) {
          setPromptReason(promptData.data.reason);
          setActivityValue(promptData.data.activityValue);
          setActivitySummary(summaryData.data);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking prompt status:', error);
    }
  };

  // Set up beforeunload listener to prompt before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      checkPromptStatus();
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    isOpen,
    setIsOpen,
    activitySummary,
    promptReason,
    activityValue,
    checkPromptStatus
  };
}