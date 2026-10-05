FROM wordpress:php8.3-apache

COPY railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh

COPY --chown=www-data:www-data plugins/portfolio-studio/ /usr/src/wordpress/wp-content/plugins/portfolio-studio/

ENTRYPOINT ["/usr/local/bin/railway-entrypoint.sh"]
CMD ["apache2-foreground"]

EXPOSE 80
