/**
 * VoterProfileContext — Global state provider for VoteReady
 *
 * Stores the VoterProfile object that drives 100% of the app:
 * - voterType, state, constituency, primaryConcern, language, completedSteps
 *
 * Persists language + completedSteps to localStorage.
 * Loads existing profile on mount for splash-skip logic.
 */
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'voteready_profile';

/** Default VoterProfile shape */
export const defaultProfile = {
  voterType: '',          // 'first_time' | 'returning' | 'nri' | 'student'
  state: '',              // one of 28 states + 8 UTs
  constituency: '',
  primaryConcern: '',     // 'register' | 'booth' | 'process' | 'candidates'
  language: 'English',
  completedSteps: [],     // e.g. [1, 2]
  checklist: [],          // e.g. ['ft_1', 'ft_3']
  isOnboarded: false,     // true after completing onboarding flow
};

/** Load persisted profile from localStorage */
function loadProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultProfile, ...parsed };
    }
  } catch {
    // Corrupted data — start fresh
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

/** Save profile to localStorage */
function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage full or blocked — fail silently
  }
}

/** Action types */
export const Actions = {
  SET_PROFILE: 'SET_PROFILE',
  UPDATE_LANGUAGE: 'UPDATE_LANGUAGE',
  TOGGLE_STEP: 'TOGGLE_STEP',
  TOGGLE_CHECKLIST: 'TOGGLE_CHECKLIST',
  RESET: 'RESET',
};

/** Reducer */
export function profileReducer(state, action) {
  switch (action.type) {
    case Actions.SET_PROFILE:
      return { ...defaultProfile, ...action.payload };

    case Actions.UPDATE_LANGUAGE:
      return { ...state, language: action.payload };

    case Actions.TOGGLE_STEP: {
      const stepId = action.payload;
      const exists = state.completedSteps.includes(stepId);
      const completedSteps = exists
        ? state.completedSteps.filter((s) => s !== stepId)
        : [...state.completedSteps, stepId];
      return { ...state, completedSteps };
    }

    case Actions.TOGGLE_CHECKLIST: {
      const itemId = action.payload;
      const has = state.checklist.includes(itemId);
      const checklist = has
        ? state.checklist.filter((id) => id !== itemId)
        : [...state.checklist, itemId];
      return { ...state, checklist };
    }

    case Actions.RESET:
      localStorage.removeItem(STORAGE_KEY);
      return { ...defaultProfile };

    default:
      return state;
  }
}

/** Context */
const VoterProfileContext = createContext(null);

/**
 * VoterProfileProvider — wraps the entire app
 */
export function VoterProfileProvider({ children }) {
  const existingProfile = loadProfile();
  const [profile, dispatch] = useReducer(
    profileReducer,
    existingProfile || { ...defaultProfile }
  );

  // Persist on every change
  useEffect(() => {
    if (profile.voterType) {
      saveProfile(profile);
    }
  }, [profile]);

  // Action dispatchers
  const setProfile = useCallback((profileData) => {
    dispatch({ type: Actions.SET_PROFILE, payload: profileData });
  }, []);

  const updateLanguage = useCallback((language) => {
    dispatch({ type: Actions.UPDATE_LANGUAGE, payload: language });
  }, []);

  const toggleStep = useCallback((stepId) => {
    dispatch({ type: Actions.TOGGLE_STEP, payload: stepId });
  }, []);

  const resetProfile = useCallback(() => {
    dispatch({ type: Actions.RESET });
  }, []);

  const toggleChecklistItem = useCallback((itemId) => {
    dispatch({ type: Actions.TOGGLE_CHECKLIST, payload: itemId });
  }, []);

  /** Check if a complete profile already exists (for splash-skip) */
  const hasExistingProfile = Boolean(
    profile.voterType && profile.state && profile.primaryConcern
  );

  /** Check if user has been onboarded */
  const isOnboarded = profile.isOnboarded || hasExistingProfile;

  const value = {
    profile: { ...profile, isOnboarded: isOnboarded },
    hasExistingProfile,
    setProfile,
    updateLanguage,
    toggleStep,
    toggleChecklistItem,
    resetProfile,
  };

  return (
    <VoterProfileContext.Provider value={value}>
      {children}
    </VoterProfileContext.Provider>
  );
}

/**
 * useVoterProfile — custom hook to consume voter profile context
 */
export function useVoterProfile() {
  const context = useContext(VoterProfileContext);
  if (!context) {
    throw new Error('useVoterProfile must be used within VoterProfileProvider');
  }
  return context;
}

export default VoterProfileContext;
