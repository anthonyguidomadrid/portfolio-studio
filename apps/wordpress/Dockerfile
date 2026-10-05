FROM wordpress:php8.3-apache

RUN set -eux; \
	a2dismod mpm_event || true; \
	a2dismod mpm_worker || true; \
	rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*; \
	a2enmod mpm_prefork; \
	apache2ctl -M | grep -q 'mpm_prefork_module'; \
	! apache2ctl -M | grep -Eq 'mpm_(event|worker)_module'

COPY plugins/portfolio-studio/ /var/www/html/wp-content/plugins/portfolio-studio/

RUN chown -R www-data:www-data /var/www/html/wp-content/plugins/portfolio-studio

EXPOSE 80