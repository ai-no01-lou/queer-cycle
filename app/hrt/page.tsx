'use client';

import { useEffect, useState } from 'react';

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
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Log HRT Dose</h1>

      {status === 'success' && (
        <div className="bg-green-800 border border-green-600 text-green-200 rounded px-4 py-2 mb-4 text-sm">
          ✓ HRT dose logged!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Date *</label>
          <input type="date" required value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Medication *</label>
          <input type="text" required value={form.medication}
            onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full"
            placeholder="e.g. Estradiol" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Dose (mg) *</label>
          <input type="number" required step="0.1" min="0" value={form.dose_mg}
            onChange={e => setForm(f => ({ ...f, dose_mg: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full"
            placeholder="e.g. 2" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Notes</label>
          <textarea value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full h-20 resize-none"
            placeholder="Optional notes..." />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={status === 'loading'}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-5 py-2 rounded font-medium w-full">
          {status === 'loading' ? 'Saving...' : 'Log Dose'}
        </button>
      </form>
    </div>
  );
}
