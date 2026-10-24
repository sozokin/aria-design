import Icons from '@/components/Icons';

import { INavEntry } from './Sidebar.types';

/** The shell's navigation, in the order both the sidebar and the mobile menu show it. */
export const PRIMARY_NAV: INavEntry[] = [
  { label: 'Home', icon: Icons.home, current: true },
  { label: 'Team', icon: Icons.users },
  { label: 'Coaching', icon: Icons.target },
  { label: 'Deals', icon: Icons.briefcase },
  { label: 'Library', icon: Icons.library },
];

export const SECONDARY_NAV: INavEntry[] = [
  { label: 'Help', icon: Icons.help },
  { label: 'Settings', icon: Icons.settings },
];
