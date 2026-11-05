export const SPLASH_KEY = 'schreibtisch:splash'
export const SPLASH_MS = 1200
export const SPLASH_MS_REDUCED = 600

export function splashSeen(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_KEY) !== null
  } catch {
    return true
  }
}

export function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_KEY, '1')
  } catch {
    // ohne sessionStorage erscheint der Startbildschirm ohnehin nicht
  }
}
