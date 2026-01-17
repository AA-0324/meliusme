// Push Notification Service for Melius

const NOTIFICATION_KEY = 'melius-notifications';

interface NotificationSchedule {
  waterReminders: boolean;
  mealReminders: boolean;
  lastWaterReminder?: number;
  lastMealReminder?: number;
}

export function getNotificationSettings(): NotificationSchedule {
  const stored = localStorage.getItem(NOTIFICATION_KEY);
  if (!stored) {
    return { waterReminders: true, mealReminders: true };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { waterReminders: true, mealReminders: true };
  }
}

export function saveNotificationSettings(settings: Partial<NotificationSchedule>): void {
  const current = getNotificationSettings();
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify({ ...current, ...settings }));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function areNotificationsSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
}

// Schedule water reminder based on goal
export function scheduleWaterReminder(currentGlasses: number, goalGlasses: number): void {
  if (currentGlasses >= goalGlasses) return;
  
  const remainingGlasses = goalGlasses - currentGlasses;
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(22, 0, 0, 0); // 10 PM
  
  const hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return;
  
  const glassesPerHour = remainingGlasses / hoursLeft;
  const nextReminderMinutes = Math.max(30, Math.floor(60 / glassesPerHour));
  
  // Store the next reminder time
  const settings = getNotificationSettings();
  if (settings.lastWaterReminder) {
    const timeSinceLast = now.getTime() - settings.lastWaterReminder;
    if (timeSinceLast < nextReminderMinutes * 60 * 1000) {
      return; // Don't remind too soon
    }
  }
  
  saveNotificationSettings({ lastWaterReminder: now.getTime() });
}

// Check if it's time for a meal reminder
export function checkMealReminder(todayMealTypes: string[]): { shouldRemind: boolean; mealType: string } {
  const hour = new Date().getHours();
  
  // Breakfast: 7-10 AM
  if (hour >= 7 && hour <= 10 && !todayMealTypes.includes('breakfast')) {
    return { shouldRemind: true, mealType: 'breakfast' };
  }
  
  // Lunch: 11 AM - 2 PM
  if (hour >= 11 && hour <= 14 && !todayMealTypes.includes('lunch')) {
    return { shouldRemind: true, mealType: 'lunch' };
  }
  
  // Dinner: 5-8 PM
  if (hour >= 17 && hour <= 20 && !todayMealTypes.includes('dinner')) {
    return { shouldRemind: true, mealType: 'dinner' };
  }
  
  return { shouldRemind: false, mealType: '' };
}

export function sendWaterReminder(currentGlasses: number, goalGlasses: number): void {
  const remaining = goalGlasses - currentGlasses;
  if (remaining <= 0) return;
  
  sendNotification('💧 Time to hydrate!', {
    body: `You've had ${currentGlasses} glasses. ${remaining} more to reach your goal!`,
    tag: 'water-reminder',
  });
}

export function sendMealReminder(mealType: string): void {
  const messages: Record<string, string> = {
    breakfast: "Start your day right with a healthy breakfast!",
    lunch: "It's lunchtime! Don't forget to eat.",
    dinner: "Time to think about dinner!",
  };
  
  sendNotification(`🍽️ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Reminder`, {
    body: messages[mealType] || 'Time for a meal!',
    tag: 'meal-reminder',
  });
}
