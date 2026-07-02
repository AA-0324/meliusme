// Push Notification Service for Melius — encrypted storage

import { getEncryptedJSON, setEncryptedJSON } from './encryptedStorage';

const NOTIFICATION_KEY = 'melius-notifications';

interface NotificationSchedule {
  waterReminders: boolean;
  mealReminders: boolean;
  lastWaterReminder?: number;
  lastMealReminder?: number;
}

const DEFAULT_SCHEDULE: NotificationSchedule = { waterReminders: true, mealReminders: true };

async function readEncLS<T>(key: string, fallback: T): Promise<T> {
  return getEncryptedJSON<T>(key, fallback);
}

async function writeEncLS(key: string, value: unknown): Promise<void> {
  await setEncryptedJSON(key, value);
}

export async function getNotificationSettings(): Promise<NotificationSchedule> {
  return readEncLS<NotificationSchedule>(NOTIFICATION_KEY, DEFAULT_SCHEDULE);
}

export async function saveNotificationSettings(settings: Partial<NotificationSchedule>): Promise<void> {
  const current = await getNotificationSettings();
  await writeEncLS(NOTIFICATION_KEY, { ...current, ...settings });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function areNotificationsSupported(): boolean { return 'Notification' in window; }

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, { icon: '/favicon.ico', badge: '/favicon.ico', ...options });
  }
}

export function scheduleWaterReminder(currentGlasses: number, goalGlasses: number): void {
  if (currentGlasses >= goalGlasses) return;
  const remainingGlasses = goalGlasses - currentGlasses;
  const now = new Date();
  const endOfDay = new Date(now); endOfDay.setHours(22, 0, 0, 0);
  const hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft <= 0) return;
  const nextReminderMinutes = Math.max(30, Math.floor(60 / (remainingGlasses / hoursLeft)));

  getNotificationSettings().then(settings => {
    if (settings.lastWaterReminder) {
      const timeSinceLast = now.getTime() - settings.lastWaterReminder;
      if (timeSinceLast < nextReminderMinutes * 60 * 1000) return;
    }
    saveNotificationSettings({ lastWaterReminder: now.getTime() });
  });
}

export function checkMealReminder(todayMealTypes: string[]): { shouldRemind: boolean; mealType: string } {
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 10 && !todayMealTypes.includes('breakfast')) return { shouldRemind: true, mealType: 'breakfast' };
  if (hour >= 11 && hour <= 14 && !todayMealTypes.includes('lunch')) return { shouldRemind: true, mealType: 'lunch' };
  if (hour >= 17 && hour <= 20 && !todayMealTypes.includes('dinner')) return { shouldRemind: true, mealType: 'dinner' };
  return { shouldRemind: false, mealType: '' };
}

export function sendWaterReminder(currentGlasses: number, goalGlasses: number): void {
  const remaining = goalGlasses - currentGlasses;
  if (remaining <= 0) return;
  sendNotification('Time to hydrate', { body: `You've had ${currentGlasses} glasses. ${remaining} more to reach your goal!`, tag: 'water-reminder' });
}

export function sendMealReminder(mealType: string): void {
  const messages: Record<string, string> = {
    breakfast: "Start your day right with a healthy breakfast!",
    lunch: "It's lunchtime! Don't forget to eat.",
    dinner: "Time to think about dinner!",
  };
  sendNotification(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} reminder`, { body: messages[mealType] || 'Time for a meal!', tag: 'meal-reminder' });
}
