const NY = 'America/New_York';

const dateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: NY,
  hour: 'numeric',
  minute: '2-digit',
});

export function formatEventRange(startsOn: string, endsOn: string): string {
  const s = new Date(startsOn);
  const e = new Date(endsOn);
  const sd = dateFmt.format(s);
  const st = timeFmt.format(s);
  const et = timeFmt.format(e);

  const sameCalendarDay =
    new Intl.DateTimeFormat('en-CA', { timeZone: NY, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      s,
    ) ===
    new Intl.DateTimeFormat('en-CA', { timeZone: NY, year: 'numeric', month: '2-digit', day: '2-digit' }).format(e);

  if (sameCalendarDay) {
    return `${sd} · ${st} – ${et}`;
  }

  const ed = dateFmt.format(e);
  return `${sd} ${st} → ${ed} ${et}`;
}

/** `ymd` is `YYYY-MM-DD` interpreted as a calendar day in Eastern Time. */
export function formatNyCalendarHeading(ymd: string): string {
  const [y, m, d] = ymd.split('-').map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) return ymd;
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 17, 0, 0));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: NY,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(noonUtc);
}
