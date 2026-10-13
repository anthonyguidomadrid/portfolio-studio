#!/bin/sh
set -eu

rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
a2enmod mpm_prefork >/dev/null 2>&1 || true

mpm_modules=$(apache2ctl -M 2>&1 | grep -E 'mpm_(event|worker|prefork)_module' || true)
if ! printf '%s\n' "$mpm_modules" | grep -q 'mpm_prefork_module' || \
	printf '%s\n' "$mpm_modules" | grep -Eq 'mpm_(event|worker)_module'; then
	printf 'Unexpected Apache MPM configuration:\n%s\n' "$mpm_modules" >&2
	exit 1
fi

# Fresh volumes mount root-owned, so Apache (www-data) cannot create upload folders.
uploads_dir=/var/www/html/wp-content/uploads
if [ "$(id -u)" = "0" ] && [ -d "$uploads_dir" ]; then
	find "$uploads_dir" \! -user www-data -exec chown www-data:www-data {} + ||
		printf 'Warning: could not set ownership of %s\n' "$uploads_dir" >&2
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"