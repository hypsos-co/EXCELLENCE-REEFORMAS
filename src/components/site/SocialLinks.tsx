import { siteConfig } from "@/config/site";
import { cx } from "@/lib/cx";
import { IconFacebook, IconGoogle, IconInstagram, IconLinkedIn, IconTikTok, IconYouTube } from "@/components/icons";

/** Botones para seguir en redes sociales. Solo aparecen las configuradas en src/config/site.ts. */
export function socialItems() {
  const s = siteConfig.social;
  return [
    s.instagram && { href: s.instagram, label: "Instagram", icon: <IconInstagram size={20} /> },
    s.facebook && { href: s.facebook, label: "Facebook", icon: <IconFacebook size={20} /> },
    s.tiktok && { href: s.tiktok, label: "TikTok", icon: <IconTikTok size={20} /> },
    s.youtube && { href: s.youtube, label: "YouTube", icon: <IconYouTube size={20} /> },
    s.linkedin && { href: s.linkedin, label: "LinkedIn", icon: <IconLinkedIn size={20} /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];
}

export function SocialLinks({ tone = "light", withGoogle = false, className }: { tone?: "light" | "dark"; withGoogle?: boolean; className?: string }) {
  const items = socialItems();
  const google = withGoogle && siteConfig.social.googleReviews;
  return (
    <ul className={cx("flex flex-wrap gap-2.5", className)}>
      {items.map((i) => (
        <li key={i.label}>
          <a
            href={i.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              "inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold transition",
              tone === "light" ? "bg-white text-navy ring-1 ring-navy/15 hover:ring-navy" : "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20",
            )}
          >
            {i.icon}
            Seguir en {i.label}
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </li>
      ))}
      {google && (
        <li>
          <a
            href={siteConfig.social.googleReviews}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              "inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-[15px] font-bold transition",
              tone === "light" ? "bg-white text-navy ring-1 ring-navy/15 hover:ring-navy" : "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20",
            )}
          >
            <IconGoogle size={18} />
            Reseña en Google
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </a>
        </li>
      )}
    </ul>
  );
}
