# Local development image: PHP 8 + Apache, serving the Parcel build at "/"
# and the PHP blog at "/blog/" (see apache.conf).
FROM php:8.3-apache

# pdo_mysql is required by the blog; fileinfo is already built into the base image.
RUN docker-php-ext-install pdo_mysql

# Match the 5 MB upload cap enforced by blog/src/ImageUpload.php.
RUN { \
      echo 'upload_max_filesize = 8M'; \
      echo 'post_max_size = 10M'; \
    } > /usr/local/etc/php/conf.d/uploads.ini

COPY apache.conf /etc/apache2/sites-available/000-default.conf
