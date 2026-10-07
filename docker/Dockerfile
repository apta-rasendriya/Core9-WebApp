# Local development image: PHP 8 + Apache, serving the Parcel build at "/"
# and the PHP blog at "/insights/" (see apache.conf).
FROM php:8.3-apache

# pdo_mysql is required by the blog; fileinfo is already built into the base image.
RUN docker-php-ext-install pdo_mysql

# GD resizes uploaded article images and saves them as WebP (blog/src/ImageUpload.php)
RUN apt-get update && apt-get install -y --no-install-recommends libjpeg62-turbo-dev libpng-dev libwebp-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install gd \
    && rm -rf /var/lib/apt/lists/*

# Match the 5 MB upload cap enforced by blog/src/ImageUpload.php.
RUN { \
      echo 'upload_max_filesize = 8M'; \
      echo 'post_max_size = 10M'; \
    } > /usr/local/etc/php/conf.d/uploads.ini

# Compression and caching rules in build/.htaccess and blog/.htaccess
RUN a2enmod deflate headers expires

COPY apache.conf /etc/apache2/sites-available/000-default.conf
