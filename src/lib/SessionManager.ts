import { writable, get } from 'svelte/store';

// Type definitions
export interface SessionData {
  startTime: number;
  endTime?: number;
  totalBets: number;
  totalWins: number;
  activities: ActivityData[];
  breaks: BreakData[];
  isActive: boolean;
}

export interface SessionSettings {
  maxSessionDuration: number;
  continuousPlayLimit: number;
  breakDuration: number;
}

export interface ActivityData {
  timestamp: number;
  action: 'spin' | 'deposit' | 'withdraw';
  amount: number;
  result?: number;
}

export interface BreakData {
  startTime: number;
  endTime?: number;
  duration: number;
}

export interface BreakResult {
  isNeeded: boolean;
  reason?: string;
  timeUntilBreak?: number;
}

// Default session settings
const defaultSettings: SessionSettings = {
  maxSessionDuration: 120 * 60 * 1000, // 2 hours in milliseconds
  continuousPlayLimit: 60 * 60 * 1000, // 1 hour in milliseconds
  breakDuration: 15 * 60 * 1000 // 15 minutes in milliseconds
};

// Initialize session store
const sessionStore = writable<SessionData>({
  startTime: Date.now(),
  totalBets: 0,
  totalWins: 0,
  activities: [],
  breaks: [],
  isActive: true
});

// Session settings store
export const sessionSettings = writable<SessionSettings>(defaultSettings);

// Auto-save session data every 30 seconds
const autoSaveInterval = setInterval(() => {
  const currentData = get(sessionStore);
  localStorage.setItem('sessionData', JSON.stringify(currentData));
}, 30000);

/**
 * Track player activity
 * @param action The type of action performed
 * @param amount The amount bet or deposited/withdrawn
 * @param result The result of the action (e.g., win amount)
 */
export function trackActivity(action: 'spin' | 'deposit' | 'withdraw', amount: number, result?: number): void {
  sessionStore.update(session => {
    const activity: ActivityData = {
      timestamp: Date.now(),
      action,
      amount,
      result
    };

    if (action === 'spin') {
      session.totalBets += amount;
      if (result && result > 0) {
        session.totalWins += result;
      }
    }

    session.activities.push(activity);
    return session;
  });
}

/**
 * Check if a break is needed based on session settings
 * @returns BreakResult object with break information
 */
export function checkIfBreakNeeded(): BreakResult {
  const session = get(sessionStore);
  const settings = get(sessionSettings);
  
  if (!session.isActive) {
    return { isNeeded: false };
  }

  // Get current timestamp
  const now = Date.now();
  
  // Check if total session duration exceeded
  const sessionDuration = now - session.startTime;
  if (sessionDuration >= settings.maxSessionDuration) {
    return {
      isNeeded: true,
      reason: "You've reached your maximum session duration. Time to take a break."
    };
  }
  
  // Check continuous play limit
  const lastBreakEnd = session.breaks.length > 0 
    ? session.breaks[session.breaks.length - 1].endTime || 0
    : session.startTime;
  
  const timeSinceLastBreak = now - lastBreakEnd;
  
  if (timeSinceLastBreak >= settings.continuousPlayLimit) {
    return {
      isNeeded: true,
      reason: "You've been playing for an hour straight. Take a goddamn break."
    };
  }
  
  // If a break is not immediately needed, calculate time until next break
  const timeUntilBreak = settings.continuousPlayLimit - timeSinceLastBreak;
  
  return {
    isNeeded: false,
    timeUntilBreak
  };
}

/**
 * Take a break
 * @param duration Optional custom break duration in milliseconds
 * @returns The new break data
 */
export function takeBreak(duration?: number): BreakData {
  const settings = get(sessionSettings);
  const breakDuration = duration || settings.breakDuration;
  
  const newBreak: BreakData = {
    startTime: Date.now(),
    duration: breakDuration
  };
  
  sessionStore.update(session => {
    session.isActive = false;
    session.breaks.push(newBreak);
    return session;
  });
  
  return newBreak;
}

/**
 * Resume play after a break
 */
export function resumePlay(): void {
  sessionStore.update(session => {
    const currentBreak = session.breaks[session.breaks.length - 1];
    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = Date.now();
    }
    session.isActive = true;
    return session;
  });
}

/**
 * End the current session
 */
export function endSession(): void {
  sessionStore.update(session => {
    session.endTime = Date.now();
    session.isActive = false;
    return session;
  });
  
  // Save final session data
  const finalData = get(sessionStore);
  localStorage.setItem('sessionData', JSON.stringify(finalData));
  
  // Clear auto-save interval
  clearInterval(autoSaveInterval);
}

/**
 * Load saved session data from localStorage
 */
export function loadSessionData(): void {
  const savedData = localStorage.getItem('sessionData');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData) as SessionData;
      sessionStore.set(parsedData);
    } catch (error) {
      console.error('Failed to load saved session data:', error);
    }
  }
}

/**
 * Get player statistics from the current session
 * @returns Object containing session statistics
 */
export function getPlayerStats() {
  const session = get(sessionStore);
  
  const totalDuration = session.endTime 
    ? session.endTime - session.startTime
    : Date.now() - session.startTime;
    
  const totalBreakDuration = session.breaks.reduce((total, breakData) => {
    const breakEnd = breakData.endTime || Date.now();
    return total + (breakEnd - breakData.startTime);
  }, 0);
  
  const activeDuration = totalDuration - totalBreakDuration;
  
  return {
    totalBets: session.totalBets,
    totalWins: session.totalWins,
    netProfit: session.totalWins - session.totalBets,
    rtp: session.totalBets > 0 ? (session.totalWins / session.totalBets) * 100 : 0,
    totalDuration: Math.floor(totalDuration / 60000), // in minutes
    activeDuration: Math.floor(activeDuration / 60000), // in minutes
    breakCount: session.breaks.length,
    spinsCount: session.activities.filter(a => a.action === 'spin').length
  };
}

// Export the session store for components to subscribe
export const session = {
  subscribe: sessionStore.subscribe
}; 