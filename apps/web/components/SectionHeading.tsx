export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  eyebrow?: string;
}) {
  const centered = align === 'center';
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? <p className="eyebrow mb-5">{eyebrow}</p> : null}
      <h2 className="h2 text-ink dark:text-white">{title}</h2>
      {subtitle ? <p className={`lead mt-4 ${centered ? 'mx-auto' : ''}`}>{subtitle}</p> : null}
    </div>
  );
}
