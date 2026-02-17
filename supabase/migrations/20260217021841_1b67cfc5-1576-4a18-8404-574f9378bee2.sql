-- Move notes to description where description is empty
UPDATE transactions 
SET description = trim(notes), notes = NULL 
WHERE trim(description) = '' AND notes IS NOT NULL AND trim(notes) != '';