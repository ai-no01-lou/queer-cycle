'use client';

import { useEffect, useState } from 'react';

interface Term {
  id: string;
  key: string;
  label: string;
  is_custom: boolean;
}

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
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Terminology Settings</h1>
      <p className="text-gray-400 text-sm mb-4">Customize labels used throughout the app.</p>

      <div className="space-y-3 mb-8">
        {terms.map(term => (
          <div key={term.id} className="flex items-center gap-3">
            <span className="text-gray-400 text-xs w-32 shrink-0 font-mono">{term.key}</span>
            <input
              value={term.label}
              onChange={e => updateLabel(term.id, e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white flex-1 text-sm" />
            <button
              onClick={() => saveTerm(term)}
              disabled={saving[term.id]}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1.5 rounded text-sm shrink-0">
              {saved[term.id] ? '✓' : saving[term.id] ? '...' : 'Save'}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-6">
        <h2 className="text-lg font-semibold mb-3">Add Custom Term</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={newKey} onChange={e => setNewKey(e.target.value)}
              placeholder="key (e.g. cycle_label)"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white flex-1 text-sm" />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="label (e.g. Period)"
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white flex-1 text-sm" />
          </div>
          <button onClick={addTerm} disabled={addStatus === 'loading'}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded text-sm">
            {addStatus === 'loading' ? 'Adding...' : addStatus === 'success' ? '✓ Added' : 'Add Term'}
          </button>
          {addStatus === 'error' && <p className="text-red-400 text-sm">Failed to add term.</p>}
        </div>
      </div>
    </div>
  );
}
