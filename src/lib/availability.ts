// Amanda's bookable windows — edit RULES to change days/hours
// weekday uses JS Date.getDay() convention: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
export const SCHEDULE_CONFIG = {
  timezone: 'America/Vancouver' as const,
  slotMinutes: 30,
  leadTimeHours: 24,  // no booking within 24h from now
  daysAhead: 21,      // slots generated this many days forward
  rules: [
    { weekday: 1, startHour: 10, endHour: 20 }, // Monday    10:00–20:00 Vancouver
    { weekday: 2, startHour: 10, endHour: 20 }, // Tuesday   10:00–20:00 Vancouver
    { weekday: 3, startHour: 10, endHour: 20 }, // Wednesday 10:00–20:00 Vancouver
    { weekday: 4, startHour: 10, endHour: 20 }, // Thursday  10:00–20:00 Vancouver
    { weekday: 5, startHour: 10, endHour: 20 }, // Friday    10:00–20:00 Vancouver
  ],
}

function getVancouverParts(utcMs: number): { weekday: number; hour: number } {
  const tz = SCHEDULE_CONFIG.timezone
  const d = new Date(utcMs)
  const DAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const wdStr = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d)
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', hour12: false,
  }).formatToParts(d)
  const rawH = timeParts.find(p => p.type === 'hour')?.value ?? '-1'
  return {
    weekday: DAYS[wdStr] ?? -1,
    // h24 edge case: midnight returns '24' in some locales — clamp to 0 (irrelevant for 10–14 window)
    hour: rawH === '24' ? 0 : Number(rawH),
  }
}

// Returns available slot start times (UTC Date objects).
// takenMs: Set of UTC milliseconds for every occupied 30-min block.
//   Callers must expand multi-slot bookings — a 60-min booking at T adds T and T+30min.
// durationMinutes: the booking length being requested (30 or 60).
//   A 60-min slot is only returned if BOTH the slot and slot+30min are free.
export function generateAvailableSlots(
  takenMs: Set<number> = new Set(),
  now: Date = new Date(),
  durationMinutes: number = 30,
): Date[] {
  const { slotMinutes, leadTimeHours, daysAhead, rules } = SCHEDULE_CONFIG
  const stepMs = slotMinutes * 60 * 1000
  const leadMs = leadTimeHours * 60 * 60 * 1000
  const endMs = now.getTime() + daysAhead * 24 * 60 * 60 * 1000
  const blocksNeeded = Math.ceil(durationMinutes / slotMinutes)

  const slots: Date[] = []
  let cursor = new Date(Math.ceil(now.getTime() / stepMs) * stepMs)

  while (cursor.getTime() < endMs) {
    const ms = cursor.getTime()
    if (ms - now.getTime() >= leadMs) {
      // All 30-min blocks required for this duration must be within a valid rule window AND free
      let valid = true
      for (let b = 0; b < blocksNeeded; b++) {
        const blockMs = ms + b * stepMs
        if (takenMs.has(blockMs)) { valid = false; break }
        const { weekday, hour } = getVancouverParts(blockMs)
        if (!rules.find(r => r.weekday === weekday && hour >= r.startHour && hour < r.endHour)) {
          valid = false; break
        }
      }
      if (valid) slots.push(new Date(cursor))
    }
    cursor = new Date(ms + stepMs)
  }

  return slots
}

// ── Display helpers ───────────────────────────────────────────────────────────

// "Tuesday, June 24, 2026 at 10:00 AM PDT"
export function formatSlot(isoStr: string, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date(isoStr))
}

// "Tue, Jun 24" — date group header
export function formatSlotDateHeader(isoStr: string, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoStr))
}

// "10:00 AM PDT" — time chip label
export function formatSlotTime(isoStr: string, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date(isoStr))
}

// Group slots by date label (client-side, uses visitor's local tz)
export function groupSlotsByDate(
  isoSlots: string[],
  localTz: string,
): Array<{ dateLabel: string; slots: string[] }> {
  const groups = new Map<string, string[]>()
  for (const iso of isoSlots) {
    const label = formatSlotDateHeader(iso, localTz)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(iso)
  }
  return Array.from(groups.entries()).map(([dateLabel, slots]) => ({ dateLabel, slots }))
}

// Get visitor's local IANA timezone (client-side only)
export function getLocalTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' }
}
