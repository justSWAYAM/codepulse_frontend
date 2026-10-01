import React from 'react';
import { Badge } from './ui';

export const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <Badge tone={active ? 'success' : 'neutral'} size="sm" dot>
    {active ? 'Active' : 'Inactive'}
  </Badge>
);
