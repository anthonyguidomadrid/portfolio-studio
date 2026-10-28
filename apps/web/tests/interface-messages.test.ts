import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { messages } from "@/messages/en";

const root = fileURLToPath(new URL("../", import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(filename)
      : filename.endsWith(".tsx")
        ? [filename]
        : [];
  });
}

describe("frontend message catalog", () => {
  it("keeps visible JSX text and accessible labels out of components and routes", () => {
    const violations: string[] = [];
    const textAttributes = new Set([
      "aria-label",
      "aria-description",
      "alt",
      "title",
      "placeholder",
    ]);
    for (const filename of [
      ...sourceFiles(path.join(root, "app")),
      ...sourceFiles(path.join(root, "components")),
    ]) {
      const source = ts.createSourceFile(
        filename,
        readFileSync(filename, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node: ts.Node) {
        const literalText = ts.isJsxText(node) && /\S/.test(node.text);
        const literalAttribute =
          ts.isJsxAttribute(node) &&
          textAttributes.has(node.name.getText(source)) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer) &&
          /\S/.test(node.initializer.text);
        const expressionText =
          ts.isJsxExpression(node) &&
          node.expression &&
          (ts.isStringLiteral(node.expression) ||
            ts.isNoSubstitutionTemplateLiteral(node.expression)) &&
          /\S/.test(node.expression.text);
        if (literalText || literalAttribute || expressionText) {
          const position = source.getLineAndCharacterOfPosition(
            node.getStart(source),
          );
          violations.push(
            `${path.relative(root, filename)}:${position.line + 1}: ${node.getText(source).trim()}`,
          );
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    expect(violations).toEqual([]);
  });

  it("formats complete dynamic interface phrases in the catalog", () => {
    expect(messages.youtube.coverAlt("Selected work")).toBe(
      "Cover for Selected work",
    );
    expect(messages.footer.copyright(2026, "Studio")).toBe("© 2026 Studio");
    expect(messages.footer.emailAddressLabel("hello@example.com")).toBe(
      "Email hello@example.com",
    );
    expect(messages.portfolio.photosCountLabel(3)).toBe("3 portfolio photos");
    expect(messages.portfolio.openPhotoLabel("Portrait")).toBe(
      "View photo: Portrait",
    );
  });
});
