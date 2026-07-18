import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, GitFork, LogOut, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { auth, signOut } from "@/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="portal-shell">
      <header className="topbar">
        <Link href="/runs" className="wordmark">
          <span className="brand-mark small"><PanelsTopLeft size={17} /></span>
          <span>UI EVIDENCE</span>
          <b>PORTAL</b>
        </Link>
        <nav>
          <Link href="/runs" className="nav-active"><Activity size={16} /> Test runs</Link>
          <a href="https://github.com/mtzack-org/ui-evidence-portal" target="_blank" rel="noreferrer"><GitFork size={16} /> Repository</a>
        </nav>
        <div className="user-menu">
          <ShieldCheck size={15} />
          <span>@{session.user.login}</span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button type="submit" aria-label="Sign out"><LogOut size={15} /></button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
