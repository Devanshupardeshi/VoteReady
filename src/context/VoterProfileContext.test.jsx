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
  });
});
