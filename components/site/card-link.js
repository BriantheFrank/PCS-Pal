import Link from "next/link";

export function CardLink({ href, title, description, cta = "Open page", className = "nav-card" }) {
  return (
    <Link className={className} href={href}>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      <span className="card-link">{cta}</span>
    </Link>
  );
}
