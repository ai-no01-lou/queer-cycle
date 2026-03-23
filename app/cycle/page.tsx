'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Term {
  id: string;
  key: string;
  label: string;
}

export default function CyclePage() {
  const router = useRouter();
  const [terms, setTerms] = useState<Record<string, string>>({});
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bleed_start: '',
    bleed_end: '',
    flow: 'medium',
    mood: 'okay',
    symptoms: [] as string[],
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const symptomOptions = ['cramps', 'bloating', 'headache', 'fatigue'];

  useEffect(() => {
    fetch('/api/terminology')
      .then(r => r.json())
      .then((data: Term[]) => {
        const map: Record<string, string> = {};
        data.forEach((t: Term) => { map[t.key] = t.label; });
        setTerms(map);
      })
      .catch(() => {});

    fetch('/api/modules?slug=cycle')
      .then(r => r.json())
      .then((data: { id: string }[]) => {
        if (data?.[0]?.id) setModuleId(data[0].id);
      })
      .catch(() => {});
  }, []);

  function label(key: string, fallback: string) {
    return terms[key] || fallback;
  }

  function toggleSymptom(s: string) {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s)
        ? f.symptoms.filter(x => x !== s)
        : [...f.symptoms, s],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleId) { setError('Module not loaded'); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          data: form,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setTimeout(() => router.push('/'), 1500);
    } catch {
      setStatus('error');
      setError('Failed to save entry.');
    }
  }

  if (status === 'success') {
    return <div className="text-green-400 text-lg">✓ Entry saved! Redirecting...</div>;
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">{label('cycle_log_title', 'Log Cycle')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">{label('bleed_start', 'Bleed Start')} *</label>
          <input type="date" required value={form.bleed_start}
            onChange={e => setForm(f => ({ ...f, bleed_start: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">{label('bleed_end', 'Bleed End')}</label>
          <input type="date" value={form.bleed_end}
            onChange={e => setForm(f => ({ ...f, bleed_end: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">{label('flow', 'Flow')}</label>
          <select value={form.flow}
            onChange={e => setForm(f => ({ ...f, flow: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full">
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">{label('mood', 'Mood')}</label>
          <select value={form.mood}
            onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full">
            <option value="good">Good</option>
            <option value="okay">Okay</option>
            <option value="bad">Bad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">{label('symptoms', 'Symptoms')}</label>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map(s => (
              <button type="button" key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-1 rounded text-sm border ${form.symptoms.includes(s) ? 'bg-pink-600 border-pink-500' : 'bg-gray-800 border-gray-700'}`}>
                {label(s, s)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={status === 'loading'}
          className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 px-5 py-2 rounded font-medium w-full">
          {status === 'loading' ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}
