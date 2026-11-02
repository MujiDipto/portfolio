import Image from "next/image";

/** The mascot's picture: Muji's own AI-generated knight cat. */
export function CatImage({ width, height }: { width: number; height: number }) {
  return (
    <Image
      src="/sudo.webp"
      alt=""
      width={width}
      height={height}
      unoptimized
      loading="eager"
      draggable={false}
      className="block"
    />
  );
}
