import Icons from '@/components/Icons';

import { INavEntry } from './Sidebar.types';

/** The main navigation entries, in the order the sidebar and the mobile menu both show them. */
export const PRIMARY_NAV: INavEntry[] = [
  { label: 'Home', icon: Icons.home, current: true },
  { label: 'Team', icon: Icons.users },
  { label: 'Coaching', icon: Icons.target },
  { label: 'Deals', icon: Icons.briefcase },
  { label: 'Library', icon: Icons.library },
];

/** The entries shown at the bottom of the sidebar (after a divider in the mobile menu). */
export const SECONDARY_NAV: INavEntry[] = [
  { label: 'Help', icon: Icons.help },
  { label: 'Settings', icon: Icons.settings },
];
