UPDATE texts
SET difficulty = CASE
  WHEN word_count <= 5 THEN 'easy'
  WHEN word_count <= 10 THEN 'medium'
  ELSE 'hard'
END;