import { Numbers } from "@/components/Numbers";

export function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="marker:text-muted mt-3 max-w-[72ch] list-disc space-y-2 pl-5 leading-relaxed">
      {items.map((item) => (
        <li key={item}>
          <Numbers text={item} />
        </li>
      ))}
    </ul>
  );
}
