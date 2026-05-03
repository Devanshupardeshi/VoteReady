import { describe, it, expect } from 'vitest';
import { profileReducer, defaultProfile, Actions } from './VoterProfileContext.jsx';

describe('VoterProfileContext Reducer', () => {
  it('should initialize with default state', () => {
    const state = profileReducer(defaultProfile, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(defaultProfile);
  });

  it('should handle SET_PROFILE', () => {
    const action = {
      type: Actions.SET_PROFILE,
      payload: { voterType: 'NRI', state: 'MH' }
    };
    const newState = profileReducer(defaultProfile, action);
    expect(newState.voterType).toBe('NRI');
    expect(newState.state).toBe('MH');
  });

  it('should handle RESET', () => {
    const modifiedState = { ...defaultProfile, voterType: 'Student' };
    const action = { type: Actions.RESET };
    const newState = profileReducer(modifiedState, action);
    expect(newState.voterType).toBe('');
  });

  it('should handle TOGGLE_CHECKLIST', () => {
    const action = { type: Actions.TOGGLE_CHECKLIST, payload: 'check-name' };
    const stateAfterToggleOn = profileReducer(defaultProfile, action);
    expect(stateAfterToggleOn.checklist).toContain('check-name');

    const stateAfterToggleOff = profileReducer(stateAfterToggleOn, action);
    expect(stateAfterToggleOff.checklist).not.toContain('check-name');
  });

  it('should handle TOGGLE_STEP', () => {
    const action = { type: Actions.TOGGLE_STEP, payload: 3 };
    const newState = profileReducer(defaultProfile, action);
    expect(newState.completedSteps).toContain(3);
    
    // Toggle off
    const stateAfterToggleOff = profileReducer(newState, action);
    expect(stateAfterToggleOff.completedSteps).not.toContain(3);
  });
});


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VoterProfileContext, { VoterProfileProvider, useVoterProfile } from './VoterProfileContext.jsx';

const TestComponent = () => {
  const { profile, setProfile, updateLanguage, toggleStep, toggleChecklistItem, resetProfile } = useVoterProfile();
  return (
    <div>
      <span data-testid="voterType">{profile.voterType}</span>
      <span data-testid="language">{profile.language}</span>
      <span data-testid="onboarded">{profile.isOnboarded ? 'yes' : 'no'}</span>
      <button onClick={() => setProfile({ voterType: 'first_time', state: 'MH', primaryConcern: 'register' })}>SetProfile</button>
      <button onClick={() => updateLanguage('Hindi')}>UpdateLang</button>
      <button onClick={() => toggleStep(1)}>ToggleStep</button>
      <button onClick={() => toggleChecklistItem('ft_1')}>ToggleChecklist</button>
      <button onClick={resetProfile}>Reset</button>
    </div>
  );
};

describe('VoterProfileProvider and useVoterProfile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('throws an error if useVoterProfile is used outside of provider', () => {
    const consoleError = console.error;
    console.error = () => {}; // suppress React error boundary logging
    expect(() => render(<TestComponent />)).toThrow('useVoterProfile must be used within VoterProfileProvider');
    console.error = consoleError;
  });

  it('provides context values and handles actions', () => {
    render(
      <VoterProfileProvider>
        <TestComponent />
      </VoterProfileProvider>
    );

    // Initial state
    expect(screen.getByTestId('voterType').textContent).toBe('');
    expect(screen.getByTestId('language').textContent).toBe('English');

    // Set Profile
    fireEvent.click(screen.getByText('SetProfile'));
    expect(screen.getByTestId('voterType').textContent).toBe('first_time');
    // It should persist to localStorage since voterType is set
    const stored = JSON.parse(localStorage.getItem('voteready_profile'));
    expect(stored.voterType).toBe('first_time');

    // Update Language
    fireEvent.click(screen.getByText('UpdateLang'));
    expect(screen.getByTestId('language').textContent).toBe('Hindi');

    // Toggle Step
    fireEvent.click(screen.getByText('ToggleStep'));
    
    // Reset Profile
    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByTestId('voterType').textContent).toBe('');
    expect(localStorage.getItem('voteready_profile')).toBeNull();
  });

  it('loads profile from localStorage on mount', () => {
    localStorage.setItem('voteready_profile', JSON.stringify({ voterType: 'nri', state: 'DL', primaryConcern: 'booth' }));
    
    render(
      <VoterProfileProvider>
        <TestComponent />
      </VoterProfileProvider>
    );

    expect(screen.getByTestId('voterType').textContent).toBe('nri');
    expect(screen.getByTestId('onboarded').textContent).toBe('yes');
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('voteready_profile', 'invalid-json');
    
    render(
      <VoterProfileProvider>
        <TestComponent />
      </VoterProfileProvider>
    );

    expect(screen.getByTestId('voterType').textContent).toBe('');
    expect(localStorage.getItem('voteready_profile')).toBeNull();
  });

  it('silently ignores localStorage setItem errors', () => {
    // Mock localStorage.setItem to throw error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); };
    
    render(
      <VoterProfileProvider>
        <TestComponent />
      </VoterProfileProvider>
    );
    
    fireEvent.click(screen.getByText('SetProfile'));
    expect(screen.getByTestId('voterType').textContent).toBe('first_time'); // state still updates
    
    // Restore
    Storage.prototype.setItem = originalSetItem;
  });
});
