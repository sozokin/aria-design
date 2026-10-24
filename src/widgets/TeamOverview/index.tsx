import { type CSSProperties, type FC as ReactFC } from 'react';
import { motion } from 'motion/react';

import PinnedList from './PinnedList';

import { LOAD_IN, loadIn } from '@/lib/motion';

import { ITeamOverview } from './TeamOverview.types';

const OVERVIEW_STATS = [
  {
    label: 'Calls reviewed',
    value: '18',
    context: 'this week',
    trend: [42, 54, 48, 68, 74, 100],
    note: 'Five reps have new moments ready to review.',
  },
  {
    label: 'Coaching follow-ups',
    value: '4',
    context: 'open',
    trend: [56, 72, 62, 78, 70, 88],
    note: 'Lena and Didi have check-ins scheduled today.',
  },
  {
    label: 'Deals needing attention',
    value: '3',
    context: 'active',
    trend: [88, 76, 82, 68, 58, 52],
    note: 'Brookfield and Percepto have follow-ups this week.',
  },
] as const;

/**
 * The team's stats and the Pinned block. The same content appears in three places: the desktop
 * right rail, the mobile drawer (with a larger heading) and inline under the brief on mobile,
 * where the parent shows the heading and the stats use the shell's horizontal card scroller. On
 * first paint its blocks fade in one after another (LOAD_IN): top to bottom in the rail, and in
 * the inline card the stats left to right. The drawer mounts later and appears as it is.
 */
const TeamOverview: ReactFC<ITeamOverview> = ({ pinned, onJumpToPinned, variant = 'rail' }) => {
  const showsOwnTitle = variant !== 'inline';
  const block = (index: number) =>
    variant === 'drawer' ? {} : loadIn(LOAD_IN.rail + index * LOAD_IN.step);

  return (
    <>
      <section
        aria-labelledby={showsOwnTitle ? 'signals-title' : undefined}
        aria-label={showsOwnTitle ? undefined : 'Team overview'}
      >
        <motion.div className="section-head flex-wrap" {...block(0)}>
          {showsOwnTitle && (
            <h2
              id="signals-title"
              className={
                variant === 'drawer'
                  ? 'm-0 font-heading text-base font-medium text-foreground'
                  : 'section-title'
              }
            >
              Team overview
            </h2>
          )}
          <span className="section-meta">Today · 6 reps · 12 active deals</span>
        </motion.div>

        <div className={variant === 'inline' ? 'stat-grid' : 'grid grid-cols-1 gap-3'}>
          {OVERVIEW_STATS.map((stat, index) => (
            <motion.article
              className="stat"
              key={stat.label}
              aria-label={`${stat.label}: ${stat.value} ${stat.context}`}
              {...block(1 + index)}
            >
              <div className="stat-head">
                <span className="stat-skill">{stat.label}</span>
              </div>
              <div className="stat-value-row">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-context">{stat.context}</span>
              </div>
              <div className="bars" aria-hidden="true">
                {stat.trend.map((height, index) => (
                  <span key={index} style={{ '--h': `${height}%` } as CSSProperties} />
                ))}
              </div>
              <p className="stat-note">{stat.note}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <motion.div {...block(1 + OVERVIEW_STATS.length)}>
        <PinnedList pinned={pinned} onJump={onJumpToPinned} />
      </motion.div>
    </>
  );
};

export default TeamOverview;
