-- Default user
INSERT INTO users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'lou@localhost', 'Lou')
ON CONFLICT (id) DO NOTHING;

-- Module registry
INSERT INTO module_registry (id, slug, name, schema)
VALUES
  (gen_random_uuid(), 'hrt', 'HRT Dose Log', '{"fields": ["dose_mg", "medication", "route", "notes"]}'),
  (gen_random_uuid(), 'cycle', 'Cycle Log', '{"fields": ["phase", "flow", "cramps", "mood", "notes"]}')
ON CONFLICT (slug) DO NOTHING;

-- Default terminology for the default user
INSERT INTO user_terminology (user_id, key, label)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'period',  'Period'),
  ('00000000-0000-0000-0000-000000000001', 'flow',    'Flow'),
  ('00000000-0000-0000-0000-000000000001', 'cramps',  'Cramps'),
  ('00000000-0000-0000-0000-000000000001', 'mood',    'Mood'),
  ('00000000-0000-0000-0000-000000000001', 'spotting','Spotting'),
  ('00000000-0000-0000-0000-000000000001', 'cycle',   'Cycle')
ON CONFLICT (user_id, key) DO NOTHING;
