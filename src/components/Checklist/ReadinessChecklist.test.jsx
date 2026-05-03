import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadinessChecklist from './ReadinessChecklist.jsx';
import { VoterProfileContext } from '../../context/VoterProfileContext.jsx';

// Mock context hook directly
vi.mock('../../context/VoterProfileContext.jsx', async () => {
  const actual = await vi.importActual('../../context/VoterProfileContext.jsx');
  return {
    ...actual,
    useVoterProfile: vi.fn(),
  };
});

import { useVoterProfile } from '../../context/VoterProfileContext.jsx';

describe('ReadinessChecklist Component', () => {
  it('renders correctly for a general voter profile', () => {
    useVoterProfile.mockReturnValue({
      profile: {
        voterType: 'returning',
        checklist: [],
      },
      toggleChecklistItem: vi.fn()
    });

    render(<ReadinessChecklist />);
    
    // Expect general checklist items for 'returning' voter
    expect(screen.getByText('My enrollment is up to date at my current address')).toBeTruthy();
    expect(screen.getByText('I know my assigned polling booth')).toBeTruthy();
  });

  it('renders specific items for NRI voters', () => {
    useVoterProfile.mockReturnValue({
      profile: {
        voterType: 'nri',
        checklist: [],
      },
      toggleChecklistItem: vi.fn()
    });

    render(<ReadinessChecklist />);
    
    expect(screen.getByText('I have submitted Form 6A to my constituency')).toBeTruthy();
    expect(screen.getByText('My Indian passport is valid')).toBeTruthy();
  });

  it('calls toggleChecklistItem when an item is clicked', () => {
    const toggleMock = vi.fn();
    useVoterProfile.mockReturnValue({
      profile: {
        voterType: 'first_time',
        checklist: [],
      },
      toggleChecklistItem: toggleMock
    });

    render(<ReadinessChecklist />);
    
    // Find the checkbox button for the first item
    const verifyNameButton = screen.getByText('I have a valid Voter ID (EPIC) card');
    
    fireEvent.click(verifyNameButton);
    
    expect(toggleMock).toHaveBeenCalledWith('ft_1');
  });

  it('calculates progress accurately', () => {
    useVoterProfile.mockReturnValue({
      profile: {
        voterType: 'first_time',
        checklist: ['ft_1', 'ft_2', 'ft_3'], // 3 out of 6 complete
      },
      toggleChecklistItem: vi.fn()
    });

    render(<ReadinessChecklist />);
    
    // 3/6 = 50%
    expect(screen.getByText('50%')).toBeTruthy();
  });
});
