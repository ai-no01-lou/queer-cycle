'use client';

import { useEffect, useState } from 'react';

const inputClass = "border rounded px-3 py-2 text-sm w-full min-h-[44px]";
const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text)" };
const labelStyle = { color: "var(--text-muted)" };

export default function HRTPage() {
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    dose_mg: '',
    medication: 'Estradiol',
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/modules?slug=hrt')
      .then(r => r.json())
      .then((data: { id: string }[]) => {
        if (data?.[0]?.id) setModuleId(data[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleId) { setError('HRT module not loaded'); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          data: { ...form, dose_mg: parseFloat(form.dose_mg) },
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm(f => ({ ...f, dose_mg: '', notes: '' }));
    } catch {
      setStatus('error');
      setError('Failed to save entry.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Log HRT Dose</h1>

      {status === 'success' && (
        <div className="rounded px-4 py-3 mb-4 text-sm border" style={{ background: "var(--bg-surface)", borderColor: "var(--accent)", color: "var(--success)" }}>
          ✓ HRT dose logged!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" style={labelStyle}>Date *</label>
          <input type="date" required value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="block text-sm mb-1" style={labelStyle}>Medication *</label>
          <input type="text" required value={form.medication}
            onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
            className={inputClass} style={inputStyle}
            placeholder="e.g. Estradiol" />
        </div>

        <div>
          <label className="block text-sm mb-1" style={labelStyle}>Dose (mg) *</label>
          <input type="number" required step="0.1" min="0" value={form.dose_mg}
            onChange={e => setForm(f => ({ ...f, dose_mg: e.target.value }))}
            className={inputClass} style={inputStyle}
            placeholder="e.g. 2" />
        </div>

        <div>
          <label className="block text-sm mb-1" style={labelStyle}>Notes</label>
          <textarea value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="border rounded px-3 py-2 text-sm w-full h-20 resize-none"
            style={inputStyle}
            placeholder="Optional notes..." />
        </div>

        {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}

        <button type="submit" disabled={status === 'loading'}
          className="px-5 rounded font-medium w-full min-h-[44px] disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {status === 'loading' ? 'Saving...' : 'Log Dose'}
        </button>
      </form>
    </div>
  );
}
