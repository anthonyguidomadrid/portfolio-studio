FROM wordpress:php8.3-apache

COPY railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh

COPY plugins/portfolio-studio/ /var/www/html/wp-content/plugins/portfolio-studio/

RUN chown -R www-data:www-data /var/www/html/wp-content/plugins/portfolio-studio

ENTRYPOINT ["/usr/local/bin/railway-entrypoint.sh"]
CMD ["apache2-foreground"]

EXPOSE 80
