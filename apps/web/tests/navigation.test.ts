import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/site-config";
import { isCurrentNavigationPath } from "@/lib/navigation";

describe("isCurrentNavigationPath", () => {
  it("activates Home only at the root route", () => {
    expect(isCurrentNavigationPath(ROUTES.home, ROUTES.home)).toBe(true);
    expect(isCurrentNavigationPath("/about", ROUTES.home)).toBe(false);
  });

  it("keeps Portfolio active on detail routes", () => {
    expect(isCurrentNavigationPath(ROUTES.portfolio, ROUTES.portfolio)).toBe(
      true,
    );
    expect(
      isCurrentNavigationPath("/portfolio/sample-project", ROUTES.portfolio),
    ).toBe(true);
    expect(isCurrentNavigationPath("/portfolios", ROUTES.portfolio)).toBe(
      false,
    );
  });

  it("matches other navigation paths exactly", () => {
    expect(isCurrentNavigationPath("/about", ROUTES.about)).toBe(true);
    expect(isCurrentNavigationPath("/about/team", ROUTES.about)).toBe(false);
  });
});
