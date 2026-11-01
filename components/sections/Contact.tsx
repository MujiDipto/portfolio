import { Section, linkClass } from "@/components/Section";
import { contact } from "@/lib/content";

const rows = [
  { label: "email", link: contact.email },
  { label: "linkedin", link: contact.linkedin },
  { label: "github", link: contact.github },
];

export function Contact() {
  return (
    <Section id="contact" title="Contact" command="cat contact">
      <dl className="grid gap-x-8 gap-y-2 font-mono text-sm sm:grid-cols-[6rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted">{row.label}</dt>
            <dd className="mb-2 break-all sm:mb-0">
              <a href={row.link.href} className={linkClass}>
                {row.link.label}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
