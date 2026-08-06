'use client';

import { useState } from 'react';
import { missingFields, type Draft } from '@/lib/order';

// Shared by the phone and desktop Personalise screens so the rule and the
// "when does a field turn red" timing can't drift between them.
export function useRequiredFields(draft: Draft, onValid: () => void) {
  // Nothing is marked wrong until the drone has actually been refused once —
  // a form that greets you in red is a form you haven't filled in yet.
  const [attempted, setAttempted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const missing = missingFields(draft);

  return {
    missing,
    /** The dialog is only up while something is genuinely still empty. */
    showErrors: showErrors && missing.length > 0,
    dismiss: () => setShowErrors(false),
    /** Red border on this field — clears itself the moment something is typed. */
    invalid: (value: string) => attempted && !value.trim(),
    submit: () => {
      if (missing.length > 0) {
        setAttempted(true);
        setShowErrors(true);
        return;
      }
      onValid();
    },
  };
}
