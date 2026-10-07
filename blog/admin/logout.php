<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

Auth::logout();
redirect('login.php');
