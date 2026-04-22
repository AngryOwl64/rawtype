UPDATE words
Where language = 'de'
SET difficulty = CASE
  WHEN LENGTH(word) <= 5 THEN 'easy'::text_difficulty
  WHEN LENGTH(word) <= 10 THEN 'medium'::text_difficulty
  ELSE 'hard'::text_difficulty
END;