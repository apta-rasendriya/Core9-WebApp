<?php
declare(strict_types=1);

require __DIR__ . '/../config/config.php';
require __DIR__ . '/../src/Database.php';
require __DIR__ . '/../src/helpers.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/ImageUpload.php';
require __DIR__ . '/../src/ArticleRepository.php';
require __DIR__ . '/../src/CategoryRepository.php';

start_session_once();
