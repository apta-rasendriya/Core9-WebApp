-- Adds the optional stat-callout and pull-quote fields used by the article
-- detail page sidebar. Only needed if your articles table was created
-- before these columns were added to schema.sql — a fresh install via
-- schema.sql already has them.

USE core9_blog;

ALTER TABLE articles
  ADD COLUMN stat_value VARCHAR(40) NULL AFTER thumb_label,
  ADD COLUMN stat_label VARCHAR(200) NULL AFTER stat_value,
  ADD COLUMN quote_text VARCHAR(400) NULL AFTER stat_label,
  ADD COLUMN quote_citation VARCHAR(120) NULL AFTER quote_text;
