-- Move all profile_id=NULL records to Mônica's profile for this user
UPDATE transactions SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE installments SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE recurring_payments SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE debts SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE goals SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE reminders SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE budget_limits SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;

UPDATE cards SET profile_id = 'ba9d3389-d197-45fa-ac2f-72e0f5f10bac' WHERE user_id = '254fc8e5-c7f1-45b8-9f8a-8c6439b0a428' AND profile_id IS NULL;