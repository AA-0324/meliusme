import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkPlus, X, Trash2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { MealTemplate, getMealTemplates, deleteMealTemplate } from '@/lib/proFeatures';
import { ProBadge } from './ProBadge';
import { fadeUp } from '@/lib/motion';

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: MealTemplate) => void;
  isPro: boolean;
  onUpgradeClick: () => void;
}

export function TemplatePicker({ open, onClose, onSelect, isPro, onUpgradeClick }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    const loaded = await getMealTemplates();
    setTemplates(loaded);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteMealTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  if (open && templates.length === 0 && !loading) {
    loadTemplates();
  }

  if (!isPro) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 max-w-sm w-full border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Meal Templates</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Sparkles className="w-12 h-12 text-primary" />
                <p className="text-center text-muted-foreground">Meal templates are a Pro feature</p>
                <Button onClick={onUpgradeClick} className="w-full">
                  Upgrade to Pro
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Meal Templates</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading templates...</div>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <BookmarkPlus className="w-12 h-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">No templates saved yet</p>
                  <p className="text-center text-xs text-muted-foreground">
                    Save a meal as a template from the meal detail view
                  </p>
                </div>
              ) : (
                templates.map((template, i) => (
                  <motion.div
                    key={template.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={i}
                    onClick={() => {
                      onSelect(template);
                      onClose();
                    }}
                    className="bg-secondary/30 rounded-xl p-4 cursor-pointer hover:bg-secondary/50 transition-colors border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{template.mealType}</p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(template.id, e)}
                        className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Cal</div>
                        <div className="font-semibold">{template.calories}</div>
                      </div>
                      {template.protein !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Protein</div>
                          <div className="font-semibold">{template.protein}g</div>
                        </div>
                      )}
                      {template.fiber !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Fiber</div>
                          <div className="font-semibold">{template.fiber}g</div>
                        </div>
                      )}
                      {template.sugar !== undefined && (
                        <div>
                          <div className="text-muted-foreground">Sugar</div>
                          <div className="font-semibold">{template.sugar}g</div>
                        </div>
                      )}
                    </div>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
