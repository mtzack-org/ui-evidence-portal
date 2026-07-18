import { Globe2, Smartphone } from "lucide-react";
import type { Platform } from "@/lib/model";

export function PlatformMark({ platform }: { platform: Platform }) {
  return (
    <span className={`platform-mark platform-${platform}`}>
      {platform === "web" ? <Globe2 size={14} /> : <Smartphone size={14} />}
      {platform === "ios" ? "iOS" : platform[0].toUpperCase() + platform.slice(1)}
    </span>
  );
}
