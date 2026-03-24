'use client';

import { useEffect, useState } from 'react';

interface Term {
  id: string;
  key: string;
  label: string;
  is_custom: boolean;
}

const inputClass = "border rounded px-3 py-2 text-sm flex-1 min-h-[44px]";
const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text)" };

export default function SettingsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/terminology')
      .then(r => r.json())
      .then(setTerms)
      .catch(() => {});
  }, []);

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
      <h1 className="text-2xl font-bold mb-6">Terminology Settings</h1>
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
