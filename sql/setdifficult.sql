-- Utility SQL for adjusting word difficulty values.
-- Used when tuning seeded word data.
UPDATE words
SET difficulty = CASE
  WHEN LENGTH(word) <= 5 THEN 'easy'::text_difficulty
  WHEN LENGTH(word) <= 10 THEN 'medium'::text_difficulty
  ELSE 'hard'::text_difficulty
END
Where language = 'de';