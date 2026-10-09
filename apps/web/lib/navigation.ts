import { ROUTES } from "@/lib/site-config";

export function isCurrentNavigationPath(pathname: string, href: string) {
  if (href === ROUTES.home) return pathname === ROUTES.home;
  if (href === ROUTES.portfolio) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}
