import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

/**
 * AI Assistant Dock Component
 * Architectural extension point reserved for future phases.
 * Rendered ONLY if VITE_ENABLE_AI_ASSISTANT is explicitly 'true'.
 */
export const AiAssistantDock: React.FC = () => {
  const isEnabled = import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true';

  if (!isEnabled) {
    return null;
  }

  return (
    <aside
      aria-label="AI Assistant Dock"
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-[#14306B] text-white px-4 py-3 rounded-full shadow-lg border border-white/20 hover:bg-[#1D4A9B] cursor-pointer transition select-none"
    >
      <div className="p-1 bg-yellow-400 text-[#14306B] rounded-full">
        <Sparkles size={16} />
      </div>
      <div className="text-sm font-semibold flex items-center gap-1.5">
        <Bot size={16} />
        <span>Labour Mitra AI</span>
      </div>
      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
        Preview
      </span>
    </aside>
  );
};
