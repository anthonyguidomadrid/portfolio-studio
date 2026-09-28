interface PageHeadingProps {
  eyebrow?: string;
  title: string;
}

export function PageHeading({ eyebrow, title }: PageHeadingProps) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
    </header>
  );
}
