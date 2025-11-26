import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Entry, Insight, ModalType, Theme } from '@/types';

interface AppState {
  user: User | null;
  entries: Entry[];
  insights: Insight[];
  isLoading: boolean;
  error: string | null;
  currentModal: ModalType;
  theme: Theme;
  selectedEntry: Entry | null;
  selectedInsight: Insight | null;
  recordingState: 'idle' | 'recording' | 'processing';
  lastUpdate: Date | null;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ENTRIES'; payload: Entry[] }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'UPDATE_ENTRY'; payload: Entry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'SET_INSIGHTS'; payload: Insight[] }
  | { type: 'ADD_INSIGHT'; payload: Insight }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'OPEN_MODAL'; payload: ModalType }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SELECTED_ENTRY'; payload: Entry | null }
  | { type: 'SET_SELECTED_INSIGHT'; payload: Insight | null }
  | { type: 'SET_RECORDING_STATE'; payload: 'idle' | 'recording' | 'processing' }
  | { type: 'UPDATE_LAST_UPDATE' };

const initialState: AppState = {
  user: null,
  entries: [],
  insights: [],
  isLoading: false,
  error: null,
  currentModal: null,
  theme: 'auto',
  selectedEntry: null,
  selectedInsight: null,
  recordingState: 'idle',
  lastUpdate: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload };
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [action.payload, ...state.entries],
        lastUpdate: new Date(),
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.payload.id ? action.payload : entry
        ),
        selectedEntry: state.selectedEntry?.id === action.payload.id
          ? action.payload
          : state.selectedEntry,
        lastUpdate: new Date(),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.payload),
        selectedEntry: state.selectedEntry?.id === action.payload ? null : state.selectedEntry,
        lastUpdate: new Date(),
      };
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    case 'ADD_INSIGHT':
      return { ...state, insights: [action.payload, ...state.insights] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'OPEN_MODAL':
      return { ...state, currentModal: action.payload };
    case 'CLOSE_MODAL':
      return {
        ...state,
        currentModal: null,
        selectedEntry: null,
        selectedInsight: null,
      };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SELECTED_ENTRY':
      return { ...state, selectedEntry: action.payload };
    case 'SET_SELECTED_INSIGHT':
      return { ...state, selectedInsight: action.payload };
    case 'SET_RECORDING_STATE':
      return { ...state, recordingState: action.payload };
    case 'UPDATE_LAST_UPDATE':
      return { ...state, lastUpdate: new Date() };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        console.error('Failed to parse saved user:', error);
      }
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', state.theme);

    // Apply theme to document
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('user');
    }
  }, [state.user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Action creators for easier usage
export const appActions = {
  setUser: (user: User | null) => ({ type: 'SET_USER' as const, payload: user }),
  setEntries: (entries: Entry[]) => ({ type: 'SET_ENTRIES' as const, payload: entries }),
  addEntry: (entry: Entry) => ({ type: 'ADD_ENTRY' as const, payload: entry }),
  updateEntry: (entry: Entry) => ({ type: 'UPDATE_ENTRY' as const, payload: entry }),
  deleteEntry: (id: string) => ({ type: 'DELETE_ENTRY' as const, payload: id }),
  setInsights: (insights: Insight[]) => ({ type: 'SET_INSIGHTS' as const, payload: insights }),
  addInsight: (insight: Insight) => ({ type: 'ADD_INSIGHT' as const, payload: insight }),
  setLoading: (loading: boolean) => ({ type: 'SET_LOADING' as const, payload: loading }),
  setError: (error: string | null) => ({ type: 'SET_ERROR' as const, payload: error }),
  openModal: (modal: ModalType) => ({ type: 'OPEN_MODAL' as const, payload: modal }),
  closeModal: () => ({ type: 'CLOSE_MODAL' as const }),
  setTheme: (theme: Theme) => ({ type: 'SET_THEME' as const, payload: theme }),
  setSelectedEntry: (entry: Entry | null) => ({ type: 'SET_SELECTED_ENTRY' as const, payload: entry }),
  setSelectedInsight: (insight: Insight | null) => ({ type: 'SET_SELECTED_INSIGHT' as const, payload: insight }),
  setRecordingState: (state: 'idle' | 'recording' | 'processing') => ({ type: 'SET_RECORDING_STATE' as const, payload: state }),
  updateLastUpdate: () => ({ type: 'UPDATE_LAST_UPDATE' as const }),
};