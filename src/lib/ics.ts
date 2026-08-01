/** Minimal RFC 5545 builder used to export academic calendars to .ics files. */
export interface IcsEvent {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay?: boolean;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function stamp(value: string, allDay: boolean) {
  const date = new Date(value);
  const ymd = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  if (allDay) return ymd;
  return `${ymd}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(calendarName: string, events: IcsEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusOS//Academic Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const event of events) {
    const allDay = Boolean(event.allDay);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}@campusos`,
      `DTSTAMP:${stamp(new Date().toISOString(), false)}`,
      allDay
        ? `DTSTART;VALUE=DATE:${stamp(event.start, true)}`
        : `DTSTART:${stamp(event.start, false)}`,
      allDay ? `DTEND;VALUE=DATE:${stamp(event.end, true)}` : `DTEND:${stamp(event.end, false)}`,
      `SUMMARY:${escapeText(event.title)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, calendarName: string, events: IcsEvent[]) {
  const blob = new Blob([buildIcs(calendarName, events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
