import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import CreateGroupScreen from '@/app/group/create';
import { useCoverPicker, type CoverPickerState } from '@/hooks/use-cover-picker';
import { useCreateGroup, type CreateGroupState } from '@/hooks/use-create-group';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/hooks/use-create-group', () => ({ useCreateGroup: jest.fn() }));
jest.mock('@/hooks/use-cover-picker', () => ({ useCoverPicker: jest.fn() }));

const mockedUseCreateGroup = useCreateGroup as jest.MockedFunction<typeof useCreateGroup>;
const mockedUseCoverPicker = useCoverPicker as jest.MockedFunction<typeof useCoverPicker>;

function createState(overrides: Partial<CreateGroupState> = {}): CreateGroupState {
  return {
    isCreating: false,
    error: null,
    createGroup: jest.fn().mockResolvedValue({
      id: 'g1',
      title: 'Goa, March',
      description: null,
      coverUrl: null,
      memberCount: 1,
      role: 'owner',
      createdAt: '2026-01-01T00:00:00Z',
    }),
    clearError: jest.fn(),
    ...overrides,
  };
}

function pickerState(overrides: Partial<CoverPickerState> = {}): CoverPickerState {
  return {
    cover: null,
    isPicking: false,
    error: null,
    pick: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  mockReplace.mockClear();
  mockedUseCoverPicker.mockReturnValue(pickerState());
});

describe('CreateGroupScreen', () => {
  it('asks for a title, a description and a cover', () => {
    mockedUseCreateGroup.mockReturnValue(createState());
    render(<CreateGroupScreen />);

    expect(screen.getByLabelText('Group title')).toBeVisible();
    expect(screen.getByLabelText('Group description')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add a cover image' })).toBeVisible();
  });

  it('will not submit without a title', () => {
    mockedUseCreateGroup.mockReturnValue(createState());
    render(<CreateGroupScreen />);

    expect(screen.getByRole('button', { name: 'Create group' })).toBeDisabled();
  });

  it('creates the group and opens it', async () => {
    const createGroup = createState().createGroup;
    mockedUseCreateGroup.mockReturnValue(createState({ createGroup }));

    render(<CreateGroupScreen />);

    fireEvent.changeText(screen.getByLabelText('Group title'), 'Goa, March');
    fireEvent.changeText(screen.getByLabelText('Group description'), 'Four days');
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));

    await waitFor(() =>
      expect(createGroup).toHaveBeenCalledWith({
        dates: null,
        location: '',
        isPublic: false,
        title: 'Goa, March',
        description: 'Four days',
        cover: null,
      })
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/group/g1'));
  });

  it('passes the picked cover through to the create call', async () => {
    const createGroup = createState().createGroup;
    mockedUseCreateGroup.mockReturnValue(createState({ createGroup }));
    mockedUseCoverPicker.mockReturnValue(
      pickerState({
        cover: { uri: 'file:///cover.jpg', base64: 'AAAA', mimeType: 'image/jpeg' },
      })
    );

    render(<CreateGroupScreen />);

    fireEvent.changeText(screen.getByLabelText('Group title'), 'Goa, March');
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));

    await waitFor(() =>
      expect(createGroup).toHaveBeenCalledWith(
        expect.objectContaining({ cover: { base64: 'AAAA', mimeType: 'image/jpeg' } })
      )
    );
  });

  it('stays put and shows the reason when creation fails', async () => {
    const createGroup = jest.fn().mockRejectedValue(new Error('nope'));
    mockedUseCreateGroup.mockReturnValue(
      createState({ createGroup, error: 'Could not create the group.' })
    );

    render(<CreateGroupScreen />);

    fireEvent.changeText(screen.getByLabelText('Group title'), 'Goa, March');
    fireEvent.press(screen.getByRole('button', { name: 'Create group' }));

    await waitFor(() => expect(createGroup).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Could not create the group.')).toBeVisible();
  });
});
