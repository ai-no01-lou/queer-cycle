'use client';

import { useEffect, useState, useCallback } from 'react';

interface Entry {
  id: string;
  module_id: string;
  data: {
    date: string;
    period: boolean;
    flow?: string;
    mood?: string;
    symptoms?: string[];
  };
  created_at: string;
}

interface DaySheet {
  date: string;
  entry: Entry | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const FLOW_OPTIONS = ['spotting', 'light', 'medium', 'heavy'];
const MOOD_OPTIONS = ['great', 'okay', 'meh', 'rough'];
const SYMPTOM_OPTIONS = ['cramps', 'bloating', 'headache', 'fatigue', 'tender', 'acne'];

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<DaySheet | null>(null);
  const [form, setForm] = useState({
    period: false,
    flow: 'medium',
    mood: 'okay',
    symptoms: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch('/api/modules?slug=cycle')
      .then(r => r.json())
      .then((data: { id: string }[]) => {
        if (data?.[0]?.id) setModuleId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const loadEntries = useCallback(() => {
    fetch('/api/entries')
      .then(r => r.json())
      .then((data: Entry[]) => {
        const cycleEntries = Array.isArray(data)
          ? data.filter(e => e.data?.date)
          : [];
        setEntries(cycleEntries);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = startOffset + lastDay.getDate();
  const cells = Math.ceil(totalCells / 7) * 7;

  const entryMap: Record<string, Entry> = {};
  entries.forEach(e => {
    if (e.data?.date) entryMap[e.data.date] = e;
  });

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function openDay(dayNum: number) {
    const d = new Date(year, month, dayNum);
    const dateStr = toYMD(d);
    const existing = entryMap[dateStr] || null;
    setSheet({ date: dateStr, entry: existing });
    if (existing) {
      setForm({
        period: existing.data.period ?? false,
        flow: existing.data.flow ?? 'medium',
        mood: existing.data.mood ?? 'okay',
        symptoms: existing.data.symptoms ?? [],
      });
    } else {
      setForm({ period: false, flow: 'medium', mood: 'okay', symptoms: [] });
    }
    setSaveError('');
  }

  function closeSheet() { setSheet(null); }

  function toggleSymptom(s: string) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter(x => x !== s)
        : [...f.symptoms, s],
    }));
  }

  async function saveDay() {
    if (!sheet || !moduleId) return;
    setSaving(true);
    setSaveError('');
    const payload = { date: sheet.date, ...form };
    try {
      if (sheet.entry) {
        const res = await fetch(`/api/entries/${sheet.entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_id: moduleId, data: payload }),
        });
        if (!res.ok) throw new Error('Failed to save');
      }
      loadEntries();
      closeSheet();
    } catch {
      setSaveError('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = { background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text)' };
  const labelStyle = { color: 'var(--text-muted)' };

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-xl font-bold"
          style={{ color: 'var(--accent)' }}
          aria-label="Previous month"
        >‹</button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {MONTHS[month]} {year}
        </h1>
        <button
          onClick={nextMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-xl font-bold"
          style={{ color: 'var(--accent)' }}
          aria-label="Next month"
        >›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={labelStyle}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: cells }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const valid = dayNum >= 1 && dayNum <= lastDay.getDate();
          if (!valid) return <div key={i} />;

          const dateStr = toYMD(new Date(year, month, dayNum));
          const entry = entryMap[dateStr];
          const hasPeriod = entry?.data?.period === true;
          const isToday = dateStr === toYMD(today);

          return (
            <button
              key={i}
              onClick={() => openDay(dayNum)}
              className="flex flex-col items-center justify-start pt-1 pb-2 rounded-lg min-h-[44px]"
              style={{
                background: isToday ? 'var(--bg-surface-2)' : 'transparent',
                border: isToday ? '1px solid var(--border)' : '1px solid transparent',
              }}
              aria-label={`${dateStr}${hasPeriod ? ', period logged' : ''}`}
            >
              <span className="text-xs mb-1" style={{ color: isToday ? 'var(--accent)' : 'var(--text)', fontWeight: isToday ? 700 : 400 }}>
                {dayNum}
              </span>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: hasPeriod ? 'var(--accent)' : 'transparent',
                  border: entry ? '2px solid var(--accent)' : '2px solid var(--border)',
                  display: 'block',
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Period
        </span>
        <span className="flex items-center gap-1">
          <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--accent)', display: 'inline-block' }} />
          Logged
        </span>
      </div>

      {sheet && (
        <div
          onClick={closeSheet}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 40,
          }}
          aria-hidden="true"
        />
      )}

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          borderRadius: '16px 16px 0 0',
          padding: '20px 16px 40px',
          maxWidth: 480,
          margin: '0 auto',
          transform: sheet ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={sheet ? `Log for ${sheet.date}` : undefined}
      >
        {sheet && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                {new Date(sheet.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={closeSheet}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-2xl"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close"
              >×</button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2" style={labelStyle}>Period today?</p>
              <div className="flex gap-2">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    onClick={() => setForm(f => ({ ...f, period: val }))}
                    className="flex-1 min-h-[44px] rounded-lg text-sm font-medium border"
                    style={{
                      background: form.period === val ? 'var(--accent)' : 'var(--bg-surface)',
                      color: form.period === val ? '#fff' : 'var(--text)',
                      borderColor: form.period === val ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            {form.period && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2" style={labelStyle}>Flow</p>
                <div className="flex gap-2 flex-wrap">
                  {FLOW_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setForm(f => ({ ...f, flow: opt }))}
                      className="min-h-[44px] px-3 rounded-lg text-sm border capitalize"
                      style={{
                        background: form.flow === opt ? 'var(--accent)' : 'var(--bg-surface)',
                        color: form.flow === opt ? '#fff' : 'var(--text)',
                        borderColor: form.flow === opt ? 'var(--accent)' : 'var(--border)',
                      }}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium mb-2" style={labelStyle}>Mood</p>
              <div className="flex gap-2 flex-wrap">
                {MOOD_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setForm(f => ({ ...f, mood: opt }))}
                    className="min-h-[44px] px-3 rounded-lg text-sm border capitalize"
                    style={{
                      background: form.mood === opt ? 'var(--accent)' : 'var(--bg-surface)',
                      color: form.mood === opt ? '#fff' : 'var(--text)',
                      borderColor: form.mood === opt ? 'var(--accent)' : 'var(--border)',
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium mb-2" style={labelStyle}>Symptoms</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className="min-h-[44px] px-3 rounded-full text-sm border capitalize"
                    style={{
                      background: form.symptoms.includes(s) ? 'var(--accent)' : 'var(--bg-surface)',
                      color: form.symptoms.includes(s) ? '#fff' : 'var(--text)',
                      borderColor: form.symptoms.includes(s) ? 'var(--accent)' : 'var(--border)',
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {saveError && <p className="text-sm mb-2" style={{ color: 'var(--error)' }}>{saveError}</p>}

            <button
              onClick={saveDay}
              disabled={saving}
              className="w-full min-h-[44px] rounded-xl text-sm font-semibold"
              style={{
                background: saving ? 'var(--border)' : 'var(--accent)',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : sheet.entry ? 'Update' : 'Save'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
