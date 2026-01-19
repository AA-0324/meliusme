// Input Validation and Content Moderation for MeliusMe

// Profanity filter - basic list of inappropriate words
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock', 'pussy',
  'bastard', 'slut', 'whore', 'nigger', 'nigga', 'faggot', 'fag', 'retard',
  'cunt', 'piss', 'motherfucker', 'asshole', 'bullshit', 'dumbass'
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Check if text contains profanity (word-boundary based)
export function containsProfanity(text: string): boolean {
  const lowered = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
    return re.test(lowered);
  });
}

// Validate name input
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Name is too long (max 50 characters)' };
  }
  if (containsProfanity(name)) {
    return { valid: false, error: 'Please use appropriate language' };
  }
  return { valid: true };
}

// Validate tag input
export function validateTag(tag: string): { valid: boolean; error?: string } {
  if (!tag.trim()) {
    return { valid: false, error: 'Tag cannot be empty' };
  }
  if (tag.length > 30) {
    return { valid: false, error: 'Tag is too long (max 30 characters)' };
  }
  if (containsProfanity(tag)) {
    return { valid: false, error: 'Please use appropriate language' };
  }
  return { valid: true };
}

// Validate nutrition values - check if they make logical sense
export interface NutritionValidation {
  valid: boolean;
  errors: string[];
}

export function validateNutrition(
  calories: number,
  protein?: number,
  fiber?: number,
  sugar?: number,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): NutritionValidation {
  const errors: string[] = [];
  
  // No negative values
  if (calories < 0) errors.push('Calories cannot be negative');
  if (protein !== undefined && protein < 0) errors.push('Protein cannot be negative');
  if (fiber !== undefined && fiber < 0) errors.push('Fiber cannot be negative');
  if (sugar !== undefined && sugar < 0) errors.push('Sugar cannot be negative');
  
  // Basic sanity checks
  if (calories > 5000) errors.push('Calories seem unrealistically high for a single meal');
  if (protein !== undefined && protein > 200) errors.push('Protein seems unrealistically high');
  if (fiber !== undefined && fiber > 100) errors.push('Fiber seems unrealistically high');
  if (sugar !== undefined && sugar > 300) errors.push('Sugar seems unrealistically high');
  
  // Check if macros add up reasonably (protein ~4 cal/g, fiber ~2 cal/g, sugar ~4 cal/g)
  if (calories > 0 && protein !== undefined && fiber !== undefined && sugar !== undefined) {
    const minMacroCalories = (protein * 4) + (fiber * 0) + (sugar * 4); // fiber doesn't contribute significantly
    // If macros exceed calories significantly, something is off
    if (minMacroCalories > calories * 1.5) {
      errors.push("Nutrition values don't add up - macros exceed calories");
    }
  }
  
  // Zero calories but has macros is suspicious
  if (calories === 0 && ((protein && protein > 0) || (sugar && sugar > 0))) {
    errors.push("Can't have macros with zero calories");
  }
  
  return { valid: errors.length === 0, errors };
}

// Format time according to 12 or 24 hour preference
export function formatTime(time: string, use24Hour: boolean): string {
  if (use24Hour) return time;
  
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
