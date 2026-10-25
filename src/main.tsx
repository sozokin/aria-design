import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';

import App from './App';
import { TooltipProvider } from '@/components/ui/tooltip';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Every Motion animation follows the system's "reduce motion" setting. */}
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
    </MotionConfig>
  </StrictMode>,
);
