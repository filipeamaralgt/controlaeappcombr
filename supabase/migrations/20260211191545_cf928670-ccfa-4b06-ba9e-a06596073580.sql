
-- Associar dívida "empréstimo" ao perfil da Mônica
UPDATE debts SET profile_id = '90c3060f-cfce-47e4-b470-35db4a70633c' WHERE id = 'cd97a6ba-f7eb-40e4-b031-7f6611e4d80c';

-- Associar lembrete "Claro" ao perfil da Mônica
UPDATE reminders SET profile_id = '90c3060f-cfce-47e4-b470-35db4a70633c' WHERE id = 'e8e0f07a-819d-415c-93d9-0a910a2d0a0f';
