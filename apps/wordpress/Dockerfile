FROM wordpress:php8.3-apache

RUN a2dismod mpm_event || true; \
	a2dismod mpm_worker || true; \
	a2enmod mpm_prefork

COPY plugins/portfolio-studio/ /var/www/html/wp-content/plugins/portfolio-studio/

RUN chown -R www-data:www-data /var/www/html/wp-content/plugins/portfolio-studio

EXPOSE 80