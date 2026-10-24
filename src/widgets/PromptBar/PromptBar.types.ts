import type { Ref } from 'react';

import type { IColumnAnchor } from '@/types/layout.types';

export interface IPromptBar {
  ref: Ref<HTMLInputElement>;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  /** Centres the bar on the dashboard column on desktop; null on mobile, where CSS docks it. */
  anchor: IColumnAnchor | null;
}
