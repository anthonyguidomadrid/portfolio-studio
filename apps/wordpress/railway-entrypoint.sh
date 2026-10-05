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

exec /usr/local/bin/docker-entrypoint.sh "$@"