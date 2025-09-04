// Mental Health Advice Utility
// This file contains functions to provide mental health advice and wellness tips

export interface MentalHealthTip {
  id: string;
  category: 'stress' | 'anxiety' | 'mood' | 'sleep' | 'productivity' | 'self-care' | 'mindfulness';
  title: string;
  advice: string;
  actionable: string[];
  severity: 'low' | 'medium' | 'high';
}

// Collection of mental health tips and advice
const mentalHealthTips: MentalHealthTip[] = [
  {
    id: 'stress-001',
    category: 'stress',
    title: '🌬️ Deep Breathing for Stress Relief',
    advice: 'When feeling overwhelmed, try the 4-7-8 breathing technique. This activates your parasympathetic nervous system and helps reduce stress hormones. 🧘‍♀️',
    actionable: [
      '🔵 Inhale through your nose for 4 counts',
      '⏸️ Hold your breath for 7 counts',
      '💨 Exhale through your mouth for 8 counts',
      '🔄 Repeat 3-4 times',
    ],
    severity: 'low',
  },
  {
    id: 'anxiety-001',
    category: 'anxiety',
    title: '🌟 Grounding Technique: 5-4-3-2-1',
    advice: 'Use this sensory grounding technique to anchor yourself in the present moment when anxiety strikes. ⚓',
    actionable: [
      '👀 Name 5 things you can see',
      '✋ Name 4 things you can touch',
      '👂 Name 3 things you can hear',
      '👃 Name 2 things you can smell',
      '👅 Name 1 thing you can taste',
    ],
    severity: 'medium',
  },
  {
    id: 'mood-001',
    category: 'mood',
    title: '🌈 Mood Boosting Activities',
    advice: 'Small actions can have a big impact on your mood. Physical movement and sunlight are natural mood elevators. ☀️',
    actionable: [
      '🚶‍♀️ Take a 10-minute walk outside',
      '🎵 Listen to your favorite upbeat song',
      '🤸‍♀️ Do 5 minutes of stretching',
      '📞 Call or text a friend you care about',
      '📝 Write down 3 things you\'re grateful for',
    ],
    severity: 'low',
  },
  {
    id: 'sleep-001',
    category: 'sleep',
    title: '😴 Better Sleep Hygiene',
    advice: 'Quality sleep is fundamental to mental health. Creating a consistent sleep routine helps regulate your mood and energy. 🌙',
    actionable: [
      '⏰ Set a consistent bedtime and wake time',
      '📱 Avoid screens 1 hour before bed',
      '🌡️ Keep your bedroom cool and dark',
      '📚 Try reading or light stretching before sleep',
      '☕ Avoid caffeine after 2 PM',
    ],
    severity: 'medium',
  },
  {
    id: 'productivity-001',
    category: 'productivity',
    title: '📋 Overcoming Overwhelm',
    advice: 'When tasks feel overwhelming, breaking them down into smaller steps makes them more manageable and less anxiety-provoking. 🧩',
    actionable: [
      '✍️ Write down all your tasks',
      '⏱️ Break large tasks into 15-minute chunks',
      '🎯 Start with the easiest task to build momentum',
      '⏰ Take breaks every 25 minutes (Pomodoro technique)',
      '🎉 Celebrate small wins along the way',
    ],
    severity: 'medium',
  },
  {
    id: 'self-care-001',
    category: 'self-care',
    title: '💆‍♀️ Daily Self-Care Essentials',
    advice: 'Self-care isn\'t selfish—it\'s essential for maintaining mental health. Small daily practices compound over time. 🌱',
    actionable: [
      '💧 Drink a glass of water first thing in the morning',
      '🌿 Spend 5 minutes in nature or by a window',
      '🚫 Practice saying "no" to things that drain you',
      '😊 Do one thing that brings you joy each day',
      '🌟 End the day by acknowledging one thing you did well',
    ],
    severity: 'low',
  },
  {
    id: 'mindfulness-001',
    category: 'mindfulness',
    title: '🧘‍♂️ Present Moment Awareness',
    advice: 'Mindfulness helps break the cycle of rumination and worry by anchoring your attention in the present moment. 🎯',
    actionable: [
      '📱 Set 3 random phone alarms to check in with yourself',
      '🍽️ Practice mindful eating with one meal today',
      '🧘‍♀️ Do a 2-minute body scan from head to toe',
      '🌬️ Notice your breath without changing it for 1 minute',
      '🤔 Observe your thoughts without judging them',
    ],
    severity: 'low',
  },
  {
    id: 'anxiety-002',
    category: 'anxiety',
    title: '🌪️ Managing Worry Spirals',
    advice: 'Worry spirals can be interrupted with structured thinking techniques that help you regain perspective. 🔍',
    actionable: [
      '❓ Ask yourself: "Is this worry realistic?"',
      '⏰ Set aside 15 minutes of "worry time" each day',
      '📝 Write down your worries to externalize them',
      '🧠 Challenge negative thoughts with evidence',
      '🎯 Focus on what you can control right now',
    ],
    severity: 'medium',
  },
  {
    id: 'stress-002',
    category: 'stress',
    title: '💪 Progressive Muscle Relaxation',
    advice: 'Physical tension often accompanies mental stress. Releasing muscle tension can help calm your mind. 🧘‍♀️',
    actionable: [
      '🦶 Start with your toes—tense for 5 seconds, then relax',
      '⬆️ Move up through each muscle group',
      '🔍 Notice the difference between tension and relaxation',
      '😌 End with your face and scalp muscles',
      '🛌 Lie still for 2 minutes after finishing',
    ],
    severity: 'low',
  },
  {
    id: 'mood-002',
    category: 'mood',
    title: '🧠 Emotional Regulation Strategies',
    advice: 'Understanding and naming your emotions is the first step to managing them effectively. 💭',
    actionable: [
      '🎯 Use an emotion wheel to identify specific feelings',
      '📊 Rate your emotion intensity from 1-10',
      '🤔 Ask: "What does this emotion need from me?"',
      '💖 Practice self-compassion when feeling difficult emotions',
      '⏰ Remember: emotions are temporary visitors',
    ],
    severity: 'medium',
  },
  {
    id: 'stress-003',
    category: 'stress',
    title: '📱 Digital Detox for Mental Clarity',
    advice: 'Constant connectivity can overwhelm our minds. Taking regular breaks from devices helps reduce mental clutter and stress. 🧠',
    actionable: [
      '🔕 Turn off non-essential notifications for 2 hours',
      '🚫 Leave your phone in another room during meals',
      '📵 Set a "no screens" time 30 minutes before bed',
      '🚶‍♀️ Take a 15-minute walk without any devices',
      '🎯 Practice single-tasking instead of multitasking',
    ],
    severity: 'low',
  },
  {
    id: 'anxiety-003',
    category: 'anxiety',
    title: '🏞️ Creating Your Safe Mental Space',
    advice: 'Visualization techniques can create a sense of safety and calm when anxiety feels overwhelming. 🧘‍♀️',
    actionable: [
      '👁️ Close your eyes and imagine your favorite peaceful place',
      '👃 Focus on sensory details: sounds, smells, textures',
      '🌬️ Breathe deeply while holding this mental image',
      '🔄 Return to this visualization whenever you feel anxious',
      '📷 Create a physical reminder (photo, object) of this safe space',
    ],
    severity: 'medium',
  },
  {
    id: 'productivity-002',
    category: 'productivity',
    title: '⚡ Energy Management Over Time Management',
    advice: 'Working with your natural energy rhythms instead of against them can significantly improve both productivity and well-being. 🌟',
    actionable: [
      '🕐 Notice when you naturally feel most energetic',
      '🎯 Schedule important tasks during your peak energy times',
      '📋 Use low-energy periods for routine or administrative tasks',
      '⏸️ Take breaks before you feel tired, not after',
      '😴 Honor your need for rest without guilt',
    ],
    severity: 'low',
  },
  {
    id: 'self-care-003',
    category: 'self-care',
    title: '💝 Micro-Moments of Self-Compassion',
    advice: 'Self-compassion doesn\'t require grand gestures. Small moments of kindness toward yourself throughout the day can be transformative. ✨',
    actionable: [
      '🤗 Place your hand on your heart when feeling stressed',
      '👥 Speak to yourself as you would a good friend',
      '🎉 Acknowledge your efforts, not just your results',
      '🕊️ Forgive yourself for a mistake you made today',
      '🙏 Thank your body for carrying you through the day',
    ],
    severity: 'low',
  },
  {
    id: 'sleep-003',
    category: 'sleep',
    title: '🌙 Wind-Down Rituals for Better Rest',
    advice: 'Creating a consistent pre-sleep routine signals to your brain that it\'s time to prepare for rest, improving sleep quality. 😴',
    actionable: [
      '💡 Start dimming lights 1 hour before bedtime',
      '📝 Write down 3 things that went well today',
      '🧘‍♀️ Do 5 minutes of gentle stretching or yoga',
      '🙏 Practice gratitude or loving-kindness meditation',
      '🎵 Listen to calming music or nature sounds',
    ],
    severity: 'medium',
  },
  {
    id: 'mindfulness-003',
    category: 'mindfulness',
    title: '🔄 Mindful Transitions',
    advice: 'The spaces between activities are opportunities for mindfulness. These transition moments can reset your mental state. 🧘‍♂️',
    actionable: [
      '🌬️ Take 3 deep breaths before starting a new task',
      '⏸️ Pause for 30 seconds when moving between rooms',
      '🎯 Set intention before checking your phone or email',
      '🪑 Notice how your body feels when sitting down',
      '🌸 Appreciate something beautiful during transitions',
    ],
    severity: 'low',
  },
];

// Emergency resources for severe mental health situations
const emergencyResources = {
  crisis: {
    title: 'If you\'re in crisis',
    message: 'Please reach out for immediate help. You don\'t have to go through this alone.',
    resources: [
      'National Suicide Prevention Lifeline: 988 (US)',
      'Crisis Text Line: Text HOME to 741741',
      'International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/',
      'Emergency Services: 911 (US), 999 (UK), 112 (EU)',
    ],
  },
  professional: {
    title: 'Consider Professional Help',
    message: 'These feelings persist or significantly impact your daily life',
    resources: [
      'Contact your primary care doctor for referrals',
      'Psychology Today therapist finder',
      'Community mental health centers',
      'Employee Assistance Programs (EAP) through work',
      'Online therapy platforms (BetterHelp, Talkspace)',
    ],
  },
};

/**
 * Get a random mental health tip from a specific category
 */
export function getTipByCategory(category: MentalHealthTip['category']): MentalHealthTip | null {
  const categoryTips = mentalHealthTips.filter(tip => tip.category === category);
  if (categoryTips.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * categoryTips.length);
  return categoryTips[randomIndex];
}

/**
 * Get a completely random mental health tip
 */
export function getRandomTip(): MentalHealthTip {
  const randomIndex = Math.floor(Math.random() * mentalHealthTips.length);
  return mentalHealthTips[randomIndex];
}

/**
 * Get tips based on severity level
 */
export function getTipsBySeverity(severity: MentalHealthTip['severity']): MentalHealthTip[] {
  return mentalHealthTips.filter(tip => tip.severity === severity);
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): MentalHealthTip['category'][] {
  return ['stress', 'anxiety', 'mood', 'sleep', 'productivity', 'self-care', 'mindfulness'];
}

/**
 * Get multiple tips (useful for daily advice)
 */
export function getMultipleTips(count: number = 3): MentalHealthTip[] {
  const shuffled = [...mentalHealthTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, mentalHealthTips.length));
}

/**
 * Get emergency resources for crisis situations
 */
export function getEmergencyResources() {
  return emergencyResources;
}

/**
 * Get personalized advice based on user mood/situation
 */
export function getPersonalizedAdvice(mood: 'stressed' | 'anxious' | 'sad' | 'overwhelmed' | 'tired' | 'general'): {
  tip: MentalHealthTip;
  personalMessage: string;
} {
  let category: MentalHealthTip['category'];
  let personalMessage: string;

  switch (mood) {
    case 'stressed':
      category = 'stress';
      personalMessage = "I understand you're feeling stressed right now. Here's something that might help:";
      break;
    case 'anxious':
      category = 'anxiety';
      personalMessage = "Anxiety can feel overwhelming, but you have tools to manage it. Try this:";
      break;
    case 'sad':
      category = 'mood';
      personalMessage = "It's okay to feel sad sometimes. Here's a gentle way to support yourself:";
      break;
    case 'overwhelmed':
      category = 'productivity';
      personalMessage = "When everything feels like too much, breaking it down can help:";
      break;
    case 'tired':
      category = 'self-care';
      personalMessage = "Your energy is important. Here's how to take care of yourself:";
      break;
    default:
      category = 'mindfulness';
      personalMessage = "Here's a mindful practice to support your well-being:";
  }

  const tip = getTipByCategory(category) || getRandomTip();
  
  return {
    tip,
    personalMessage,
  };
}

/**
 * Format a tip for display in UI
 */
export function formatTipForDisplay(tip: MentalHealthTip): string {
  const actionItems = tip.actionable.map(action => `• ${action}`).join('\n');
  
  return `**${tip.title}**

${tip.advice}

**What you can do:**
${actionItems}

Remember: Small steps lead to big changes. Be patient and kind with yourself.`;
}

/**
 * Daily mental health check-in prompts
 */
export function getDailyCheckInPrompts(): string[] {
  return [
    "💭 How are you feeling emotionally right now?",
    "😊 What's one thing that brought you joy today?",
    "🍎 Have you taken care of your basic needs (food, water, rest)?",
    "🤔 What's weighing on your mind?",
    "🙏 What's one thing you're grateful for today?",
    "⚡ How would you rate your energy level (1-10)?",
    "💝 What's one act of self-kindness you can do right now?",
  ];
}

/**
 * Get encouraging affirmations
 */
export function getEncouragingAffirmations(): string[] {
  return [
    "💪 You are stronger than you think.",
    "🤗 It's okay to not be okay sometimes.",
    "💖 You deserve compassion, especially from yourself.",
    "🌈 This feeling is temporary—you will get through this.",
    "✨ You are worthy of love and support.",
    "🛡️ Taking care of your mental health is a sign of strength.",
    "🌟 You don't have to be perfect to be valuable.",
    "❤️ Your feelings are valid and important.",
    "🎯 You are doing the best you can with what you have.",
    "🦋 It's brave to ask for help when you need it.",
  ];
}

export default {
  getTipByCategory,
  getRandomTip,
  getTipsBySeverity,
  getAvailableCategories,
  getMultipleTips,
  getEmergencyResources,
  getPersonalizedAdvice,
  formatTipForDisplay,
  getDailyCheckInPrompts,
  getEncouragingAffirmations,
};
