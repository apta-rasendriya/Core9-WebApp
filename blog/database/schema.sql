-- Core9 Insights — database schema (MySQL / MariaDB)
-- Run this first, then seed.sql for sample content.

CREATE DATABASE IF NOT EXISTS core9_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE core9_blog;

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(90) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  excerpt VARCHAR(400) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  author_name VARCHAR(120) NOT NULL DEFAULT 'Core9 Team',
  read_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  thumb_tone VARCHAR(20) NOT NULL DEFAULT 'gold',
  thumb_label VARCHAR(80) NULL,
  thumb_image VARCHAR(255) NULL,
  header_image VARCHAR(255) NULL,
  stat_value VARCHAR(40) NULL,
  stat_label VARCHAR(200) NULL,
  quote_text VARCHAR(400) NULL,
  quote_citation VARCHAR(120) NULL,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_articles_status_published (status, published_at),
  INDEX idx_articles_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
