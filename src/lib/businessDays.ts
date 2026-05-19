// --- date helpers ---

function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Easter Sunday for a given year (Anonymous Gregorian algorithm). */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const mVal = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * mVal + 114) / 31)
  const day = ((h + l - 7 * mVal + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** n-th occurrence of weekday (0=Sun…6=Sat) in a given month (1-based). */
function nthWeekday(year: number, month: number, n: number, weekday: number): Date {
  const first = new Date(year, month - 1, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  return new Date(year, month - 1, 1 + offset + (n - 1) * 7)
}

/** Last occurrence of weekday in a given month. */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month, 0) // last day of month
  const offset = (last.getDay() - weekday + 7) % 7
  return new Date(year, month - 1, last.getDate() - offset)
}

/** Statutory observed date: Sat → Fri, Sun → Mon. */
function observed(d: Date): Date {
  const day = d.getDay()
  if (day === 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  if (day === 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  return d
}

/** Monday on or before May 24 (Victoria Day). */
function victoriaDay(year: number): Date {
  const may24 = new Date(year, 4, 24)
  const offset = (may24.getDay() - 1 + 7) % 7 // days since last Monday
  return new Date(year, 4, 24 - offset)
}

// --- holiday sets ---

/** TSX market holidays for a given year. */
function tsxHolidays(year: number): Set<string> {
  const easter = easterSunday(year)
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2)

  const holidays = [
    observed(new Date(year, 0, 1)),   // New Year's Day
    nthWeekday(year, 2, 3, 1),        // Family Day (3rd Mon in Feb)
    goodFriday,                        // Good Friday
    victoriaDay(year),                 // Victoria Day
    observed(new Date(year, 6, 1)),   // Canada Day
    nthWeekday(year, 8, 1, 1),        // Civic Holiday (1st Mon in Aug)
    nthWeekday(year, 9, 1, 1),        // Labour Day (1st Mon in Sep)
    nthWeekday(year, 10, 2, 1),       // Thanksgiving (2nd Mon in Oct)
    observed(new Date(year, 11, 25)), // Christmas Day
    observed(new Date(year, 11, 26)), // Boxing Day
  ]

  return new Set(holidays.map(fmt))
}

/** NYSE/NASDAQ market holidays for a given year. */
function nyseHolidays(year: number): Set<string> {
  const easter = easterSunday(year)
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2)

  const holidays = [
    observed(new Date(year, 0, 1)),   // New Year's Day
    nthWeekday(year, 1, 3, 1),        // MLK Day (3rd Mon in Jan)
    nthWeekday(year, 2, 3, 1),        // Presidents' Day (3rd Mon in Feb)
    goodFriday,                        // Good Friday
    lastWeekday(year, 5, 1),           // Memorial Day (last Mon in May)
    observed(new Date(year, 5, 19)),  // Juneteenth (observed since 2022)
    observed(new Date(year, 6, 4)),   // Independence Day
    nthWeekday(year, 9, 1, 1),        // Labor Day (1st Mon in Sep)
    nthWeekday(year, 11, 4, 4),       // Thanksgiving (4th Thu in Nov)
    observed(new Date(year, 11, 25)), // Christmas Day
  ]

  // Juneteenth was not a NYSE holiday before 2022
  if (year < 2022) holidays.splice(5, 1)

  return new Set(holidays.map(fmt))
}

// --- exchange classification ---

const CA_EXCHANGES = new Set(['TSX', 'TSXV', 'TSX-V', 'TSX.V', 'NEO', 'CSE', 'CNSX'])
const US_EXCHANGES = new Set(['NYSE', 'NASDAQ', 'AMEX', 'NYSE ARCA', 'NYSEARCA', 'CBOE', 'OTC', 'OTCBB', 'BATS'])

function getHolidays(year: number, exchange: string): Set<string> {
  const ex = exchange.toUpperCase().trim()
  if (CA_EXCHANGES.has(ex)) return tsxHolidays(year)
  if (US_EXCHANGES.has(ex)) return nyseHolidays(year)
  // Default to TSX if unknown
  return tsxHolidays(year)
}

// --- public API ---

/**
 * Returns the next trading day after dateStr, skipping weekends and
 * market holidays for the given exchange.
 */
export function nextBusinessDay(dateStr: string, exchange = 'TSX'): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)

  // Pre-load holidays for the year(s) we might land in
  const holidays = new Map<number, Set<string>>()
  function getH(year: number): Set<string> {
    if (!holidays.has(year)) holidays.set(year, getHolidays(year, exchange))
    return holidays.get(year)!
  }

  for (let guard = 0; guard < 14; guard++) {
    const day = d.getDay()
    if (day !== 0 && day !== 6 && !getH(d.getFullYear()).has(fmt(d))) break
    d.setDate(d.getDate() + 1)
  }

  return fmt(d)
}
