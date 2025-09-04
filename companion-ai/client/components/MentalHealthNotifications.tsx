import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Heart, MessageCircle, Settings, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  mentalHealthScheduler, 
  formatTimeUntilNext, 
  formatAdviceForNotification,
  type ScheduledAdvice 
} from '../utils/mentalHealthScheduler';

interface MentalHealthNotificationsProps {
  className?: string;
}

export default function MentalHealthNotifications({ className }: MentalHealthNotificationsProps) {
  const [unreadAdvice, setUnreadAdvice] = useState<ScheduledAdvice[]>([]);
  const [adviceHistory, setAdviceHistory] = useState<ScheduledAdvice[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAdvice, setSelectedAdvice] = useState<ScheduledAdvice | null>(null);

  useEffect(() => {
    // Load initial data
    refreshData();
    
    // Listen for new advice events
    const handleNewAdvice = (event: CustomEvent<ScheduledAdvice>) => {
      refreshData();
      setSelectedAdvice(event.detail);
    };

    window.addEventListener('mentalHealthAdvice', handleNewAdvice as EventListener);

    // Update time until next advice every minute
    const timeInterval = setInterval(() => {
      setTimeUntilNext(mentalHealthScheduler.getTimeUntilNext());
    }, 60000);

    return () => {
      window.removeEventListener('mentalHealthAdvice', handleNewAdvice as EventListener);
      clearInterval(timeInterval);
    };
  }, []);

  const refreshData = () => {
    setUnreadAdvice(mentalHealthScheduler.getUnreadAdvice());
    setAdviceHistory(mentalHealthScheduler.getAdviceHistory());
    setIsEnabled(mentalHealthScheduler.isEnabled());
    setTimeUntilNext(mentalHealthScheduler.getTimeUntilNext());
  };

  const handleToggleEnabled = (enabled: boolean) => {
    mentalHealthScheduler.setEnabled(enabled);
    setIsEnabled(enabled);
  };

  const handleMarkAsRead = (adviceId: string) => {
    mentalHealthScheduler.markAsRead(adviceId);
    refreshData();
  };

  const handleMarkAllAsRead = () => {
    mentalHealthScheduler.markAllAsRead();
    refreshData();
  };

  const handleSendNow = () => {
    mentalHealthScheduler.sendNow();
    refreshData();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">Mental Health Check-ins</h3>
          {unreadAdvice.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadAdvice.length} new
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive mental health advice every 3 days
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Next advice in: {formatTimeUntilNext(timeUntilNext)}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendNow}
                  disabled={!isEnabled}
                >
                  Send Now
                </Button>
                
                {unreadAdvice.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Advice Modal */}
      {selectedAdvice && (
        <Card className="border-pink-200 bg-pink-50 dark:bg-pink-950 dark:border-pink-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-pink-500" />
                New Mental Health Check-in
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAdvice(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-pink-700 dark:text-pink-300 font-medium">
                {selectedAdvice.personalMessage}
              </p>
              
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedAdvice.tip.title}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {selectedAdvice.tip.advice}
                </p>
                
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100">What you can do:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedAdvice.tip.actionable.map((action, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedAdvice.affirmation && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 font-medium text-center">
                    💙 {selectedAdvice.affirmation}
                  </p>
                </div>
              )}

              {selectedAdvice.checkInPrompt && (
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-700 dark:text-green-300">
                    <span className="font-medium">💭 Reflection: </span>
                    {selectedAdvice.checkInPrompt}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  handleMarkAsRead(selectedAdvice.id);
                  setSelectedAdvice(null);
                }}
                className="bg-pink-500 hover:bg-pink-600"
              >
                Got it, thanks!
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unread Advice */}
      {unreadAdvice.length > 0 && !selectedAdvice && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-500" />
            Unread Check-ins
          </h4>
          {unreadAdvice.map((advice) => (
            <Card key={advice.id} className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold">{advice.tip.title}</h5>
                      <Badge variant="secondary" className="text-xs">
                        {advice.tip.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(advice.timestamp)}
                    </p>
                    <p className="text-sm">{advice.personalMessage}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAdvice(advice)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(advice.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent History */}
      {adviceHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Recent History
          </h4>
          <div className="grid gap-2">
            {adviceHistory.slice(0, 5).map((advice) => (
              <div
                key={advice.id}
                className={`p-3 rounded-lg border text-sm ${
                  advice.isRead
                    ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                    : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{advice.tip.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {advice.tip.category}
                    </Badge>
                    {!advice.isRead && <BellOff className="h-3 w-3 text-orange-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(advice.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {adviceHistory.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Welcome to Mental Health Check-ins</h4>
            <p className="text-sm text-muted-foreground mb-4">
              You'll receive personalized mental health advice every 3 days to support your well-being.
            </p>
            <Button onClick={handleSendNow} disabled={!isEnabled}>
              Get Your First Advice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
