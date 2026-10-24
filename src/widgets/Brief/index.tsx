import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import EntityPreview from '@/components/EntityPreview';
import Icons from '@/components/Icons';
import NextStepChip from '@/widgets/AssistantExperience/NextStepChip';

import { EASE_OUT } from '@/lib/motion';

import { IBrief } from './Brief.types';

/**
 * Jordan's morning brief, as the shell provides it, plus a "Suggested next step" chip that
 * mirrors the latest coaching card's next step and asks it when clicked.
 */
const Brief: ReactFC<IBrief> = ({ suggestedNextStep, onAskNextStep }) => (
  <section className="brief" aria-labelledby="brief-title">
    <h2 id="brief-title" className="sr-only">
      Today's brief
    </h2>
    <p className="brief-lead">
      Your morning brief has <strong>three coaching moments</strong> and{' '}
      <strong>two deal follow-ups</strong> across the team.
    </p>
    <ul className="brief-points">
      <li>
        <b>Coaching.</b>{' '}
        <EntityPreview
          id="marcus-preview"
          label={
            <>
              <span className="avatar cool">MB</span>Marcus Bell
            </>
          }
        >
          <span className="hover-card-head">
            <span className="avatar cool lg">MB</span>
            <span>
              <strong>Marcus Bell</strong>
              <small>Account executive · Mid-market</small>
            </span>
          </span>
          <span className="preview-grid">
            <span>
              <small>Calls available</small>
              <strong>6 this quarter</strong>
            </span>
            <span>
              <small>Coaching moments</small>
              <strong>2 ready</strong>
            </span>
          </span>
          <span className="preview-note">
            <b>Active deal</b> Brookfield is in evaluation.
          </span>
        </EntityPreview>
        {', Lena Ortiz, and Didi Rao each have recent calls ready for review.'}
      </li>
      <li>
        <b>Deals.</b>{' '}
        <EntityPreview
          id="brookfield-preview"
          label={
            <>
              <span className="mark">
                <Icons.shield data-icon="inline-start" />
              </span>
              Brookfield
            </>
          }
        >
          <span className="hover-card-head">
            <span className="mark large">
              <Icons.shield data-icon="inline-start" />
            </span>
            <span>
              <strong>Brookfield</strong>
              <small>Enterprise opportunity</small>
            </span>
          </span>
          <span className="preview-grid">
            <span>
              <small>Stage</small>
              <strong>Evaluation</strong>
            </span>
            <span>
              <small>Next meeting</small>
              <strong>September 9</strong>
            </span>
          </span>
          <span className="preview-note">
            <b>Latest update</b> Security review is scheduled.
          </span>
        </EntityPreview>{' '}
        enters security review today; Percepto has a pricing follow-up Friday.
      </li>
    </ul>

    {/* Crossfades whenever a new answer brings a new next step. */}
    <div className="mt-1" aria-live="off">
      <p className="text-xs font-semibold text-accent-muted-foreground">Suggested next step</p>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={suggestedNextStep}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
        >
          <NextStepChip text={suggestedNextStep} onAsk={onAskNextStep} />
        </motion.div>
      </AnimatePresence>
    </div>
  </section>
);

export default Brief;
