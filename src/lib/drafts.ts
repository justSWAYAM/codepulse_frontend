/*
 * Editor drafts survive a refresh (Module 6 listed this as a gap). Stored per
 * contest + question + language in localStorage; every access is guarded because
 * storage can be blocked or full.
 */

// Keyed by user too: on a shared lab PC the next candidate must not open someone else's code
let owner = 'anonymous';

/** AuthContext calls this whenever the signed-in user changes. */
export function setDraftOwner(userId: string | null) {
  owner = userId ?? 'anonymous';
}

const draftKey = (contestId: string, questionId: string, lang: string) =>
  `cp:draft:${owner}:${contestId}:${questionId}:${lang}`;
const langKey = (contestId: string, questionId: string) => `cp:lang:${owner}:${contestId}:${questionId}`;

/** Removes every saved draft and language choice from this browser (used on logout). */
export function clearAllDrafts() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('cp:draft:') || key.startsWith('cp:lang:'))) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function loadDraft(contestId: string, questionId: string, lang: string): string | null {
  try {
    return localStorage.getItem(draftKey(contestId, questionId, lang));
  } catch {
    return null;
  }
}

export function saveDraft(contestId: string, questionId: string, lang: string, code: string) {
  try {
    localStorage.setItem(draftKey(contestId, questionId, lang), code);
  } catch {
    // quota or blocked — the code still lives in memory for this visit
  }
}

export function clearDraft(contestId: string, questionId: string, lang: string) {
  try {
    localStorage.removeItem(draftKey(contestId, questionId, lang));
  } catch {
    // ignore
  }
}

export function loadLanguage(contestId: string, questionId: string): string | null {
  try {
    return localStorage.getItem(langKey(contestId, questionId));
  } catch {
    return null;
  }
}

export function saveLanguage(contestId: string, questionId: string, lang: string) {
  try {
    localStorage.setItem(langKey(contestId, questionId), lang);
  } catch {
    // ignore
  }
}
