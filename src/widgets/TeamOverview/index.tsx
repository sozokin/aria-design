import { type CSSProperties, type FC as ReactFC } from 'react';

import PinnedList from './PinnedList';

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
 * The team's stats and the Pinned block. On desktop they stack in the right rail; on mobile they sit
 * inline under the brief, where the stats use the shell's horizontal card scroller.
 */
const TeamOverview: ReactFC<ITeamOverview> = ({ pinned, onJumpToPinned, variant = 'rail' }) => (
  <>
    <section aria-labelledby="signals-title">
      <div className="section-head flex-wrap">
        <h2 id="signals-title" className="section-title">
          Team overview
        </h2>
        <span className="section-meta">Today · 6 reps · 12 active deals</span>
      </div>

      <div className={variant === 'inline' ? 'stat-grid' : 'grid grid-cols-1 gap-3'}>
        {OVERVIEW_STATS.map(stat => (
          <article
            className="stat"
            key={stat.label}
            aria-label={`${stat.label}: ${stat.value} ${stat.context}`}
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
          </article>
        ))}
      </div>
    </section>

    <PinnedList pinned={pinned} onJump={onJumpToPinned} />
  </>
);

export default TeamOverview;
