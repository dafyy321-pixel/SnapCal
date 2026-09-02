const LOCAL_TIME_ZONE = process.env.SNAPCAL_TIME_ZONE || "Asia/Shanghai"

export function localDateParts(date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LOCAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
  }
}

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function currentStreak(dates: string[], today: string): number {
  const uniqueDates = [...new Set(dates)].sort().reverse()
  if (uniqueDates.length === 0) return 0
  const todayDate = parseLocalDate(today)
  const yesterday = new Date(todayDate)
  yesterday.setDate(yesterday.getDate() - 1)
  if (uniqueDates[0] !== today && uniqueDates[0] !== formatLocalDate(yesterday)) return 0

  let streak = 0
  const cursor = parseLocalDate(uniqueDates[0])
  for (const date of uniqueDates) {
    if (date !== formatLocalDate(cursor)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
