import { PropsWithChildren } from "react";

type SectionCardProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="card">
      <div className="card__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

