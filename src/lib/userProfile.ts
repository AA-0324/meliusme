// Local User Profile for Melius

const PROFILE_KEY = 'melius-user-profile';

export interface UserProfile {
  name: string;
  avatar?: string; // base64 data URL stored locally
  createdAt: number; // timestamp
}

export function getUserProfile(): UserProfile | null {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = getUserProfile();
  const updated: UserProfile = {
    name: profile.name ?? existing?.name ?? '',
    avatar: profile.avatar ?? existing?.avatar,
    createdAt: existing?.createdAt || Date.now(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteUserProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let greeting = 'Hello';
  
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening';
  } else {
    greeting = 'Good night';
  }
  
  return name ? `${greeting}, ${name}` : greeting;
}

export function formatMemberSince(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Joined today';
  if (diffDays === 1) return 'Member for 1 day';
  if (diffDays < 30) return `Member for ${diffDays} days`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Member for ${months} month${months > 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `Member for ${years} year${years > 1 ? 's' : ''}`;
}
