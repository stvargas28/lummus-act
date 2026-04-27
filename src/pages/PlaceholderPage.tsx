export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>This view is not yet built.</p>
    </div>
  );
}
