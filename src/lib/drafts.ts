/*
 * Editor drafts survive a refresh (Module 6 listed this as a gap). Stored per
 * contest + question + language in localStorage; every access is guarded because
 * storage can be blocked or full.
 */

const draftKey = (contestId: string, questionId: string, lang: string) => `cp:draft:${contestId}:${questionId}:${lang}`;
const langKey = (contestId: string, questionId: string) => `cp:lang:${contestId}:${questionId}`;

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
