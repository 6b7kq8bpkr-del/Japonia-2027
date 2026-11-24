// Czysty generator: nie kontaktuje się z kalendarzem ani operatorami.
const escape = value => String(value).replace(/<[^>]+>/g, '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = value => value.replace(/[-:]/g, '');
function fold(line) {
  const parts = []; let current = '';
  for (const char of line) {
    if (Buffer.byteLength(current + char, 'utf8') > 75) { parts.push(current); current = ' '; }
    current += char;
  }
  parts.push(current); return parts.join('\r\n');
}
export function calendar(events) {
  const ids = new Set();
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Japonia 2027//Terminy//PL','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Japonia 2027: terminy'];
  for (const event of events) {
    if (!event.id || ids.has(event.id)) throw new Error('Kalendarz: brak lub powtórzone id');
    ids.add(event.id);
    const next = new Date(event.date + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
    const time = event.utc ? ['DTSTART:' + stamp(event.utc),'DURATION:PT15M']
      : ['DTSTART;VALUE=DATE:' + event.date.replace(/-/g,''),'DTEND;VALUE=DATE:' + next.toISOString().slice(0,10).replace(/-/g,'')];
    lines.push('BEGIN:VEVENT', 'UID:' + (event.uid || event.id + '@japonia-2027'), 'DTSTAMP:20261124T120000Z','LAST-MODIFIED:20261124T120000Z','SEQUENCE:2', ...time,
      'SUMMARY:' + escape('Japonia 2027: ' + event.title),
      'DESCRIPTION:' + escape(event.text + ' (' + event.label + ')'),
      'URL:https://japonia-2027.vercel.app/' + event.href);
    for (const trigger of event.alarms || ['-P1D']) {
      lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:' + escape(event.title),'TRIGGER:' + trigger,'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
