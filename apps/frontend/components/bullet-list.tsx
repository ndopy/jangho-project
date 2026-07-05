export function BulletList({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
