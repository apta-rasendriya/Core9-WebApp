-- Adds uploaded-image support: a thumbnail image (used on cards) and a
-- header image (used on the article hero banner). Only needed if your
-- articles table predates these columns — a fresh install via schema.sql
-- already has them.

USE core9_blog;

ALTER TABLE articles
  ADD COLUMN thumb_image VARCHAR(255) NULL AFTER thumb_label,
  ADD COLUMN header_image VARCHAR(255) NULL AFTER thumb_image;
