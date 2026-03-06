// Input Validation and Content Moderation for MeliusMe

// Comprehensive profanity list
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock', 'pussy',
  'bastard', 'slut', 'whore', 'nigger', 'nigga', 'faggot', 'fag', 'retard',
  'cunt', 'piss', 'motherfucker', 'asshole', 'bullshit', 'dumbass',
  'cocksucker', 'dipshit', 'shithead', 'fuckface', 'twat', 'wanker',
  'jackass', 'dickhead', 'prick', 'douche', 'douchebag', 'butthole',
  'fucker', 'fucking', 'fucked', 'shitting', 'shitted', 'bitchy',
  'arse', 'arsehole', 'bollocks', 'bugger', 'tosser', 'bellend',
  'knob', 'knobhead', 'minger', 'slag', 'tranny', 'spastic',
  'retarded', 'jizz', 'cum', 'dildo', 'porn', 'hentai',
  'blowjob', 'handjob', 'rimjob', 'titjob', 'boob', 'tits',
  'penis', 'vagina', 'anus', 'anal', 'oral', 'erect',
  'orgasm', 'ejaculate', 'masturbat', 'felch', 'fisting',
  'negro', 'chink', 'gook', 'kike', 'spic', 'wetback',
  'beaner', 'cracker', 'honky', 'redneck',
];

// Leetspeak substitution map
const LEET_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i',
  '|': 'l', '+': 't', '(': 'c', ')': 'c',
};

function normalizeLeetspeak(text: string): string {
  let normalized = '';
  for (const char of text.toLowerCase()) {
    normalized += LEET_MAP[char] || char;
  }
  return normalized;
}

function stripNonAlpha(text: string): string {
  return text.replace(/[^a-z]/gi, '');
}

// Check if text contains profanity using multiple detection strategies
export function containsProfanity(text: string): boolean {
  const lowered = text.toLowerCase();
  const leetNormalized = normalizeLeetspeak(text);
  const stripped = stripNonAlpha(lowered);
  const leetStripped = stripNonAlpha(leetNormalized);

  for (const word of PROFANITY_LIST) {
    // Direct substring match
    if (lowered.includes(word)) return true;
    // Leetspeak normalized match
    if (leetNormalized.includes(word)) return true;
    // Stripped (no separators) match
    if (stripped.includes(word)) return true;
    // Leetspeak + stripped match
    if (leetStripped.includes(word)) return true;
  }

  return false;
}

// Validate name input
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
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

// Validate nutrition values
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
  
  if (calories < 0) errors.push('Calories cannot be negative');
  if (protein !== undefined && protein < 0) errors.push('Protein cannot be negative');
  if (fiber !== undefined && fiber < 0) errors.push('Fiber cannot be negative');
  if (sugar !== undefined && sugar < 0) errors.push('Sugar cannot be negative');
  
  if (calories > 5000) errors.push('Calories seem unrealistically high for a single meal');
  if (protein !== undefined && protein > 200) errors.push('Protein seems unrealistically high');
  if (fiber !== undefined && fiber > 100) errors.push('Fiber seems unrealistically high');
  if (sugar !== undefined && sugar > 300) errors.push('Sugar seems unrealistically high');
  
  if (calories > 0 && protein !== undefined && fiber !== undefined && sugar !== undefined) {
    const minMacroCalories = (protein * 4) + (fiber * 0) + (sugar * 4);
    if (minMacroCalories > calories * 1.5) {
      errors.push("Nutrition values don't add up - macros exceed calories");
    }
  }
  
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
