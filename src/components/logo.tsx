import { cn } from "@/lib/utils";

/**
 * Brand mark. SVG hosted on Cloudinary — change the URL here and every
 * surface (login, sidebar, student layout, check-in) updates at once.
 */
export const LOGO_URL =
  "https://res.cloudinary.com/dsmqsivcj/image/upload/v1779342444/erdgqkwvh2mfuprw2yfk.svg";

interface LogoProps {
  /** Pixel size of the square logo. */
  size?: number;
  /** Extra Tailwind classes (margin / sizing overrides). */
  className?: string;
}

/**
 * Renders the i-Check logo. Uses a plain <img> on purpose:
 *  - SVG bypasses next/image optimization regardless;
 *  - the file is already on a CDN, so no extra perf to gain.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={LOGO_URL}
      alt="i-Check"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
