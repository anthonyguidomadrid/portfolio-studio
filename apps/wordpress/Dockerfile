FROM wordpress:php8.3-apache

COPY plugins/portfolio-studio/ /var/www/html/wp-content/plugins/portfolio-studio/

RUN chown -R www-data:www-data /var/www/html/wp-content/plugins/portfolio-studio

EXPOSE 80