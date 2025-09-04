// Mental Health Advice Scheduler
// Automatically sends mental health advice every 3 days

import { 
  getPersonalizedAdvice, 
  getRandomTip, 
  formatTipForDisplay, 
  getDailyCheckInPrompts,
  getEncouragingAffirmations,
  type MentalHealthTip 
} from './mentalHealthAdvice';
import { sendMentalHealthAdvice } from '../lib/emailjs';

export interface ScheduledAdvice {
  id: string;
  timestamp: number;
  tip: MentalHealthTip;
  personalMessage: string;
  checkInPrompt?: string;
  affirmation?: string;
  isRead: boolean;
}

class MentalHealthScheduler {
  private readonly STORAGE_KEY = 'mentalHealthScheduler';
  private readonly ADVICE_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeScheduler();
  }

  /**
   * Initialize the scheduler and check for due advice
   */
  private initializeScheduler(): void {
    // Check immediately on initialization
    this.checkAndSendAdvice();
    
    // Set up interval to check every hour
    this.schedulerInterval = setInterval(() => {
      this.checkAndSendAdvice();
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Get stored scheduler data
   */
  private getStoredData(): {
    lastSent: number;
    adviceHistory: ScheduledAdvice[];
    isEnabled: boolean;
  } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error reading mental health scheduler data:', error);
    }

    return {
      lastSent: 0,
      adviceHistory: [],
      isEnabled: true,
    };
  }

  /**
   * Save scheduler data
   */
  private saveData(data: {
    lastSent: number;
    adviceHistory: ScheduledAdvice[];
    isEnabled: boolean;
  }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving mental health scheduler data:', error);
    }
  }

  /**
   * Check if advice is due and send if needed
   */
  private checkAndSendAdvice(): void {
    const data = this.getStoredData();
    
    if (!data.isEnabled) return;

    const now = Date.now();
    const timeSinceLastSent = now - data.lastSent;

    if (timeSinceLastSent >= this.ADVICE_INTERVAL) {
      this.sendScheduledAdvice();
    }
  }

  /**
   * Send scheduled mental health advice
   */
  private sendScheduledAdvice(): void {
    const data = this.getStoredData();
    const now = Date.now();

    // Generate personalized advice
    const moods = ['general', 'stressed', 'anxious', 'overwhelmed', 'tired'] as const;
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const advice = getPersonalizedAdvice(randomMood);

    // Get additional content
    const checkInPrompts = getDailyCheckInPrompts();
    const affirmations = getEncouragingAffirmations();
    const randomPrompt = checkInPrompts[Math.floor(Math.random() * checkInPrompts.length)];
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];

    const scheduledAdvice: ScheduledAdvice = {
      id: `advice-${now}`,
      timestamp: now,
      tip: advice.tip,
      personalMessage: advice.personalMessage,
      checkInPrompt: randomPrompt,
      affirmation: randomAffirmation,
      isRead: false,
    };

    // Add to history (keep last 10)
    data.adviceHistory.unshift(scheduledAdvice);
    data.adviceHistory = data.adviceHistory.slice(0, 10);
    data.lastSent = now;

    this.saveData(data);

    // Trigger notification and email
    this.showAdviceNotification(scheduledAdvice);
    this.sendAdviceEmail(scheduledAdvice);
  }

  /**
   * Show advice notification
   */
  private showAdviceNotification(advice: ScheduledAdvice): void {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Mental Health Check-in', {
        body: `${advice.personalMessage}\n\n${advice.tip.title}`,
        icon: '/favicon.ico',
        tag: 'mental-health-advice',
      });
    }

    // Custom event for the app to handle
    const event = new CustomEvent('mentalHealthAdvice', {
      detail: advice,
    });
    window.dispatchEvent(event);

    console.log('Mental Health Advice:', advice);
  }

  /**
   * Send advice email to user
   */
  private async sendAdviceEmail(advice: ScheduledAdvice): Promise<void> {
    try {
      // Get user info from localStorage or other source
      const userInfo = this.getUserInfo();
      if (!userInfo.email) {
        console.log('No user email found, skipping email notification');
        return;
      }

      const emailContent = this.formatAdviceForEmail(advice);
      
      await sendMentalHealthAdvice({
        user_name: userInfo.name || 'Valued User',
        user_email: userInfo.email,
        user_advice: emailContent,
      });

      console.log('Mental health advice email sent successfully');
    } catch (error) {
      console.warn('Failed to send mental health advice email:', error);
    }
  }

  /**
   * Get user info from storage or auth
   */
  private getUserInfo(): { email: string | null; name: string | null } {
    try {
      // Try to get from current user profile state
      const userProfileKey = 'currentUserProfile';
      const storedProfile = localStorage.getItem(userProfileKey);
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        return {
          email: profile.email || null,
          name: profile.name || null,
        };
      }

      // Fallback to legacy userProfile key
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        return {
          email: profile.email || null,
          name: profile.name || null,
        };
      }

      return { email: null, name: null };
    } catch (error) {
      console.warn('Error getting user info:', error);
      return { email: null, name: null };
    }
  }

  /**
   * Set user info for email notifications (call this when user logs in)
   */
  public setUserInfo(email: string, name: string): void {
    try {
      const userProfile = { email, name };
      localStorage.setItem('currentUserProfile', JSON.stringify(userProfile));
    } catch (error) {
      console.warn('Error saving user info:', error);
    }
  }

  /**
   * Format advice for email content
   */
  private formatAdviceForEmail(advice: ScheduledAdvice): string {
    const actionItems = advice.tip.actionable.map(action => `• ${action}`).join('\n');
    
    return `Hi there,

We hope you're doing well. Here's a gentle piece of advice for your mental well-being today:

${advice.personalMessage}

**${advice.tip.title}**

${advice.tip.advice}

**What you can do:**
${actionItems}

${advice.affirmation ? `${advice.affirmation}` : ''}

${advice.checkInPrompt ? `Reflection: ${advice.checkInPrompt}` : ''}

Remember, small steps build strong habits.

Best regards,
The Companion AI Team

Note: You are receiving these wellness reminders because you have notifications enabled on our website. To stop receiving them, simply turn off notifications in your account settings.`;
  }

  /**
   * Get all unread advice
   */
  public getUnreadAdvice(): ScheduledAdvice[] {
    const data = this.getStoredData();
    return data.adviceHistory.filter(advice => !advice.isRead);
  }

  /**
   * Get all advice history
   */
  public getAdviceHistory(): ScheduledAdvice[] {
    const data = this.getStoredData();
    return data.adviceHistory;
  }

  /**
   * Mark advice as read
   */
  public markAsRead(adviceId: string): void {
    const data = this.getStoredData();
    const advice = data.adviceHistory.find(a => a.id === adviceId);
    if (advice) {
      advice.isRead = true;
      this.saveData(data);
    }
  }

  /**
   * Mark all advice as read
   */
  public markAllAsRead(): void {
    const data = this.getStoredData();
    data.adviceHistory.forEach(advice => {
      advice.isRead = true;
    });
    this.saveData(data);
  }

  /**
   * Enable or disable the scheduler
   */
  public setEnabled(enabled: boolean): void {
    const data = this.getStoredData();
    data.isEnabled = enabled;
    this.saveData(data);
  }

  /**
   * Check if scheduler is enabled
   */
  public isEnabled(): boolean {
    const data = this.getStoredData();
    return data.isEnabled;
  }

  /**
   * Get time until next advice
   */
  public getTimeUntilNext(): number {
    const data = this.getStoredData();
    const now = Date.now();
    const timeSinceLastSent = now - data.lastSent;
    const timeUntilNext = this.ADVICE_INTERVAL - timeSinceLastSent;
    return Math.max(0, timeUntilNext);
  }

  /**
   * Force send advice now (for testing)
   */
  public sendNow(): void {
    this.sendScheduledAdvice();
  }

  /**
   * Test email functionality with sample advice
   */
  public async testEmail(): Promise<boolean> {
    try {
      const userInfo = this.getUserInfo();
      if (!userInfo.email) {
        console.warn('No user email found for testing');
        return false;
      }

      const testAdvice = getRandomTip();
      const testScheduledAdvice: ScheduledAdvice = {
        id: `test-${Date.now()}`,
        timestamp: Date.now(),
        tip: testAdvice,
        personalMessage: "This is a test of your mental health advice system.",
        checkInPrompt: "How are you feeling about receiving these wellness reminders?",
        affirmation: "You are taking great care of your mental health!",
        isRead: false,
      };

      await this.sendAdviceEmail(testScheduledAdvice);
      console.log('Test email sent successfully!');
      return true;
    } catch (error) {
      console.error('Test email failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Cleanup scheduler
   */
  public destroy(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }

  /**
   * Reset scheduler (clear all data)
   */
  public reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.destroy();
    this.initializeScheduler();
  }
}

// Create singleton instance
export const mentalHealthScheduler = new MentalHealthScheduler();

// Utility functions
export function formatTimeUntilNext(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
}

export function formatAdviceForNotification(advice: ScheduledAdvice): string {
  return `${advice.personalMessage}

**${advice.tip.title}**
${advice.tip.advice}

${advice.affirmation ? `${advice.affirmation}` : ''}

${advice.checkInPrompt ? `Reflection: ${advice.checkInPrompt}` : ''}`;
}

// Initialize scheduler when module loads
if (typeof window !== 'undefined') {
  // Request notification permission on first load
  mentalHealthScheduler.requestNotificationPermission();
}

export default mentalHealthScheduler;
