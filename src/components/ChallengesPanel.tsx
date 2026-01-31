import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, X, CheckCircle2, Circle, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Challenge, Badge, getEarnedBadges, REFLECTION_QUESTIONS, saveLastReflection, getLastReflection } from '@/lib/streaks';
import { useApp } from '@/contexts/AppContext';

interface ChallengesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChallengesPanel({ open, onClose }: ChallengesPanelProps) {
  const { currentChallenge, badges, meals } = useApp();
  const [showReflection, setShowReflection] = useState(false);
  
  // Get weekly reflection question
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const reflectionQuestion = REFLECTION_QUESTIONS[weekNumber % REFLECTION_QUESTIONS.length];
  const lastReflection = getLastReflection();
  const thisWeekStart = weekNumber * 7 * 24 * 60 * 60 * 1000;
  const hasReflectedThisWeek = lastReflection && lastReflection.weekNumber === weekNumber;
  
  // Get this week's meals for reflection
  const thisWeekMeals = meals.filter((m) => {
    const mealDate = new Date(m.date).getTime();
    return mealDate >= thisWeekStart;
  });

  const handleReflectionSelect = (mealId: string) => {
    saveLastReflection(weekNumber, mealId);
    setShowReflection(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 safe-top border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Challenges</h1>
                <p className="text-muted-foreground text-sm">Daily missions & achievements</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
            {/* Current Challenge */}
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {currentChallenge.type === 'daily' ? 'Daily Mission' : 'Weekly Challenge'}
                </h2>
              </div>
              
              <p className="font-semibold text-lg mb-3">{currentChallenge.title}</p>
              <p className="text-sm text-muted-foreground mb-4">{currentChallenge.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-bold">{currentChallenge.progress} / {currentChallenge.target}</span>
                </div>
                <Progress value={(currentChallenge.progress / currentChallenge.target) * 100} className="h-3" />
              </div>
              
              {currentChallenge.completed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Challenge Complete!</span>
                </motion.div>
              )}
            </div>

            {/* Weekly Reflection */}
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Weekly Reflection</h2>
              </div>
              
              <p className="font-medium mb-4">{reflectionQuestion}</p>
              
              {hasReflectedThisWeek ? (
                <div className="flex items-center gap-2 text-primary bg-primary/10 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Reflected this week</span>
                </div>
              ) : thisWeekMeals.length > 0 ? (
                <Button 
                  onClick={() => setShowReflection(true)} 
                  variant="outline" 
                  className="w-full rounded-xl"
                >
                  <span>Choose a meal</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Log meals this week to reflect on them</p>
              )}
            </div>

            {/* Earned Badges */}
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your Badges</h2>
              </div>
              
              {badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20"
                    >
                      <span className="text-2xl mb-1">{badge.icon}</span>
                      <span className="text-xs font-semibold">{badge.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Complete challenges to earn badges!
                </p>
              )}
            </div>

            {/* Challenge List */}
            <div className="bg-card rounded-2xl p-5 border border-border/50">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
                Available Challenges
              </h2>
              <div className="space-y-3">
                {[
                  { title: 'Log 3 meals today', type: 'daily' },
                  { title: 'Stay within calorie range 5 days', type: 'weekly' },
                  { title: 'Log every dinner this week', type: 'weekly' },
                  { title: 'Drink 8 glasses of water', type: 'daily' },
                  { title: 'Log a high-protein meal', type: 'daily' },
                ].map((challenge, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                    <Circle className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{challenge.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{challenge.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reflection Modal */}
          <AnimatePresence>
            {showReflection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/80 flex items-end"
                onClick={() => setShowReflection(false)}
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-h-[70vh] bg-background rounded-t-3xl p-6 overflow-y-auto"
                >
                  <h3 className="text-lg font-bold mb-4">{reflectionQuestion}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {thisWeekMeals.slice(0, 9).map((meal) => (
                      <button
                        key={meal.id}
                        onClick={() => handleReflectionSelect(meal.id)}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                      >
                        <img src={meal.photo} alt="Meal" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
