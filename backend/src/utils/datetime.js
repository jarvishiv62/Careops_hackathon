// backend/src/utils/datetime.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isBetween from "dayjs/plugin/isBetween.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/**
 * Convert time to workspace timezone
 */
export function toWorkspaceTime(date, workspaceTimezone) {
  return dayjs(date).tz(workspaceTimezone);
}

/**
 * Get start of day in workspace timezone
 */
export function getStartOfDay(date, workspaceTimezone) {
  return dayjs(date).tz(workspaceTimezone).startOf("day");
}

/**
 * Get end of day in workspace timezone
 */
export function getEndOfDay(date, workspaceTimezone) {
  return dayjs(date).tz(workspaceTimezone).endOf("day");
}

/**
 * Check if time is between two times (ignoring date)
 */
export function isTimeBetween(time, startTime, endTime) {
  const t = dayjs(time, "HH:mm");
  const start = dayjs(startTime, "HH:mm");
  const end = dayjs(endTime, "HH:mm");

  return t.isSameOrAfter(start) && t.isBefore(end);
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date) {
  return dayjs(date).day();
}

/**
 * Format date for display
 */
export function formatDate(date, format = "YYYY-MM-DD") {
  return dayjs(date).format(format);
}

/**
 * Format time for display
 */
export function formatTime(date, format = "HH:mm") {
  return dayjs(date).format(format);
}

/**
 * Add duration to date
 */
export function addMinutes(date, minutes) {
  return dayjs(date).add(minutes, "minute").toDate();
}

/**
 * Check if date is in the past
 */
export function isPast(date) {
  return dayjs(date).isBefore(dayjs());
}

/**
 * Check if date is today
 */
export function isToday(date, workspaceTimezone) {
  const today = dayjs().tz(workspaceTimezone);
  const checkDate = dayjs(date).tz(workspaceTimezone);

  return checkDate.isSame(today, "day");
}

/**
 * Get number of days between two dates
 */
export function daysBetween(date1, date2) {
  return dayjs(date2).diff(dayjs(date1), "day");
}

/**
 * Parse time string (HH:mm) and create Date object for given date
 */
export function parseTimeOnDate(dateStr, timeStr, workspaceTimezone) {
  const date = dayjs(dateStr).tz(workspaceTimezone);
  const [hours, minutes] = timeStr.split(":").map(Number);

  return date.hour(hours).minute(minutes).second(0).millisecond(0).toDate();
}

/**
 * Check if two time slots overlap
 */
export function doSlotsOverlap(slot1Start, slot1End, slot2Start, slot2End) {
  const s1Start = dayjs(slot1Start);
  const s1End = dayjs(slot1End);
  const s2Start = dayjs(slot2Start);
  const s2End = dayjs(slot2End);

  return s1Start.isBefore(s2End) && s1End.isAfter(s2Start);
}

export default dayjs;
