import React from 'react';
import { CodexModal } from './CodexModal';

export const BestiaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return <CodexModal onClose={onClose} />;
};
