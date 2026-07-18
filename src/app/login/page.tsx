import { redirect } from "next/navigation";
import { GitFork, ShieldCheck, PanelsTopLeft, PlayCircle } from "lucide-react";
import { auth, signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if ((await auth())?.user) redirect("/runs");
  const { error } = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="brand-mark"><PanelsTopLeft size={22} /></div>
        <div className="eyebrow">UI EVIDENCE / CONTROL ROOM</div>
        <h1>Every test run.<br /><span>One source of truth.</span></h1>
        <p>
          Web、Android、iOSのテスト証跡を、リリースをまたいで安全に追跡・比較します。
        </p>
        <div className="signal-row">
          <span><i className="signal signal-green" /> Web</span>
          <span><i className="signal signal-amber" /> Android</span>
          <span><i className="signal signal-blue" /> iOS</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="login-icon"><ShieldCheck size={28} /></div>
          <h2>認証して続ける</h2>
          <p>mtzack-orgのメンバー、または許可されたGitHubユーザーのみアクセスできます。</p>
          {error && <div className="auth-error">このアカウントにはアクセス権がありません。</div>}
          <form action={async () => { "use server"; await signIn("github", { redirectTo: "/runs" }); }}>
            <button className="github-button" type="submit"><GitFork size={19} /> GitHubでサインイン</button>
          </form>
          <div className="security-note"><PlayCircle size={15} /> 証跡はPrivate Blobから認証済みで配信されます</div>
        </div>
      </section>
    </main>
  );
}
