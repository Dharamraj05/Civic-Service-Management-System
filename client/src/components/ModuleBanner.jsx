export default function ModuleBanner({ kind, title, text }) {
  const isOs = kind === 'os';
  return (
    <aside className={`module-banner ${isOs ? 'module-os' : 'module-dbms'}`}>
      <p className="module-kicker">{isOs ? 'Operating system' : 'Database management system'}</p>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </aside>
  );
}
