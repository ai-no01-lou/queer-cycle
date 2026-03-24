'use client';

import { useEffect, useState } from 'react';

interface Term {
  id: string;
  key: string;
  label: string;
  is_custom: boolean;
}

const PRESET_COLORS = [
  { hex: '#C17A5A', name: 'Terracotta' },
  { hex: '#B85C6E', name: 'Rose' },
  { hex: '#9B59B6', name: 'Plum' },
  { hex: '#E8935A', name: 'Amber' },
  { hex: '#C0392B', name: 'Crimson' },
  { hex: '#7D6B8A', name: 'Mauve' },
];

const inputClass = "border rounded px-3 py-2 text-sm flex-1 min-h-[44px]";
const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text)" };

export default function SettingsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [periodColor, setPeriodColor] = useState('#C17A5A');
  const [customHex, setCustomHex] = useState('');
  const [colorStatus, setColorStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/terminology')
      .then(r => r.json())
      .then(setTerms)
      .catch(() => {});

    fetch('/api/preferences')
      .then(r => r.json())
      .then(data => {
        if (data.period_color) {
          setPeriodColor(data.period_color);
          document.documentElement.style.setProperty('--period-color', data.period_color);
        }
      })
      .catch(() => {});
  }, []);

  async function saveColor(hex: string) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    setPeriodColor(hex);
    document.documentElement.style.setProperty('--period-color', hex);
    setColorStatus('saving');
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_color: hex }),
      });
      if (!res.ok) throw new Error('Failed');
      setColorStatus('saved');
      setTimeout(() => setColorStatus('idle'), 2000);
    } catch {
      setColorStatus('error');
    }
  }

  function handleCustomHex(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      saveColor(val);
    }
  }

  function updateLabel(id: string, label: string) {
    setTerms(ts => ts.map(t => t.id === id ? { ...t, label } : t));
  }

  async function saveTerm(term: Term) {
    setSaving(s => ({ ...s, [term.id]: true }));
    try {
      await fetch(`/api/terminology/${term.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: term.label }),
      });
      setSaved(s => ({ ...s, [term.id]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [term.id]: false })), 2000);
    } catch { /* ignore */ } finally {
      setSaving(s => ({ ...s, [term.id]: false }));
    }
  }

  async function addTerm() {
    if (!newKey.trim() || !newLabel.trim()) return;
    setAddStatus('loading');
    try {
      const res = await fetch('/api/terminology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey.trim(), label: newLabel.trim(), is_custom: true }),
      });
      if (!res.ok) throw new Error('Failed');
      const created = await res.json();
      setTerms(ts => [...ts, created]);
      setNewKey('');
      setNewLabel('');
      setAddStatus('success');
      setTimeout(() => setAddStatus('idle'), 2000);
    } catch {
      setAddStatus('error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Period Color Picker */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-1">Period Color</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Choose the color used for period indicators on the calendar.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          {PRESET_COLORS.map(({ hex, name }) => (
            <button
              key={hex}
              onClick={() => { saveColor(hex); setCustomHex(''); }}
              title={name}
              aria-label={`${name} (${hex})`}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: hex,
                border: periodColor === hex ? '3px solid var(--text)' : '3px solid transparent',
                outline: periodColor === hex ? '2px solid var(--bg)' : 'none',
                outlineOffset: -5,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: periodColor,
              border: '2px solid var(--border)',
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            placeholder="Custom hex e.g. #FF6B6B"
            value={customHex}
            onChange={handleCustomHex}
            maxLength={7}
            className="border rounded px-3 text-sm"
            style={{ ...inputStyle, height: 44, width: 180 }}
          />
          {colorStatus === 'saving' && <span className="text-sm" style={{ color: "var(--text-muted)" }}>Saving…</span>}
          {colorStatus === 'saved' && <span className="text-sm" style={{ color: "var(--success)" }}>✓ Saved</span>}
          {colorStatus === 'error' && <span className="text-sm" style={{ color: "var(--error)" }}>Failed to save</span>}
        </div>
      </div>

      <div className="border-t mb-8" style={{ borderColor: "var(--border)" }} />

      {/* Terminology Settings */}
      <h2 className="text-lg font-semibold mb-1">Terminology</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Customize labels used throughout the app.</p>

      <div className="space-y-3 mb-8">
        {terms.map(term => (
          <div key={term.id} className="flex items-center gap-2">
            <span className="text-xs w-28 shrink-0 font-mono" style={{ color: "var(--text-muted)" }}>{term.key}</span>
            <input
              value={term.label}
              onChange={e => updateLabel(term.id, e.target.value)}
              className={inputClass}
              style={inputStyle} />
            <button
              onClick={() => saveTerm(term)}
              disabled={saving[term.id]}
              className="rounded text-sm shrink-0 px-3 min-h-[44px] disabled:opacity-50 border"
              style={{ background: "var(--bg-surface-2)", borderColor: "var(--border)", color: "var(--text)" }}>
              {saved[term.id] ? '✓' : saving[term.id] ? '...' : 'Save'}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t pt-6" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-lg font-semibold mb-3">Add Custom Term</h2>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={newKey} onChange={e => setNewKey(e.target.value)}
              placeholder="key (e.g. cycle_label)"
              className={inputClass}
              style={inputStyle} />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="label (e.g. Period)"
              className={inputClass}
              style={inputStyle} />
          </div>
          <button onClick={addTerm} disabled={addStatus === 'loading'}
            className="rounded text-sm px-4 min-h-[44px] disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {addStatus === 'loading' ? 'Adding...' : addStatus === 'success' ? '✓ Added' : 'Add Term'}
          </button>
          {addStatus === 'error' && <p className="text-sm" style={{ color: "var(--error)" }}>Failed to add term.</p>}
        </div>
      </div>
    </div>
  );
}
