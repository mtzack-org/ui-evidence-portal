import Link from "next/link";
import { Archive, ArrowUpRight, GitBranch, History, Search, TimerReset } from "lucide-react";
import { listRuns } from "@/lib/blob-store";
import { compactSha, relativeTime } from "@/lib/format";
import { platformSchema, runStatusSchema } from "@/lib/model";
import { PlatformMark } from "@/components/platform-mark";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; platform?: string }>;
}) {
  const filters = await searchParams;
  const allRuns = await listRuns();
  const status = runStatusSchema.safeParse(filters.status);
  const platform = platformSchema.safeParse(filters.platform);
  const query = filters.q?.trim().toLowerCase() ?? "";
  const runs = allRuns.filter((run) => {
    if (status.success && run.status !== status.data) return false;
    if (platform.success && !run.platforms[platform.data]) return false;
    if (query && !`${run.repository} ${run.workflow} ${run.branch} ${run.commitSha} ${run.commitMessage ?? ""}`.toLowerCase().includes(query)) return false;
    return true;
  });
  const passed = allRuns.filter((run) => run.status === "passed").length;
  const failed = allRuns.filter((run) => run.status === "failed").length;
  const retained = allRuns.filter((run) => run.retention !== "normal").length;

  return (
    <main className="page-wrap">
      <div className="page-heading">
        <div><div className="eyebrow">EXECUTION ARCHIVE</div><h1>Test runs</h1><p>全プラットフォームのUIテスト証跡を横断して確認できます。</p></div>
        <div className="live-indicator"><i /> EVIDENCE STORE ONLINE</div>
      </div>

      <section className="metric-grid">
        <div className="metric"><History /><div><span>Total runs</span><strong>{allRuns.length}</strong></div><small>all time</small></div>
        <div className="metric metric-green"><TimerReset /><div><span>Pass rate</span><strong>{allRuns.length ? Math.round((passed / allRuns.length) * 100) : 0}%</strong></div><small>{passed} passed</small></div>
        <div className="metric metric-red"><GitBranch /><div><span>Needs attention</span><strong>{failed}</strong></div><small>failed runs</small></div>
        <div className="metric metric-blue"><Archive /><div><span>Preserved</span><strong>{retained}</strong></div><small>no expiry</small></div>
      </section>

      <form className="filterbar">
        <label className="searchbox"><Search size={16} /><input name="q" defaultValue={filters.q} placeholder="Repository, branch, commit…" /></label>
        <select name="status" defaultValue={filters.status ?? ""} aria-label="Status"><option value="">All statuses</option><option value="passed">Passed</option><option value="failed">Failed</option><option value="running">Running</option><option value="cancelled">Cancelled</option></select>
        <select name="platform" defaultValue={filters.platform ?? ""} aria-label="Platform"><option value="">All platforms</option><option value="web">Web</option><option value="android">Android</option><option value="ios">iOS</option></select>
        <button type="submit">Apply</button>
      </form>

      <section className="run-table-wrap">
        {runs.length === 0 ? (
          <div className="empty-state"><div className="empty-radar"><i /></div><h2>No evidence yet</h2><p>GitHub Actionsから最初の実行を登録すると、ここに履歴が表示されます。</p></div>
        ) : (
          <table className="run-table">
            <thead><tr><th>Status</th><th>Run / source</th><th>Platforms</th><th>Tests</th><th>Started</th><th /></tr></thead>
            <tbody>{runs.map((run) => {
              const results = Object.entries(run.platforms);
              const total = results.reduce((sum, [, result]) => sum + result.total, 0);
              const failures = results.reduce((sum, [, result]) => sum + result.failed, 0);
              return <tr key={run.id}>
                <td><StatusBadge status={run.status} /></td>
                <td><Link href={`/runs/${run.id}`} className="run-title">{run.workflow} <span>#{run.runNumber}</span></Link><div className="source-line"><GitBranch size={13} /> {run.branch} <a href={run.links.commit} target="_blank" rel="noreferrer">{compactSha(run.commitSha)}</a></div></td>
                <td><div className="platform-list">{results.map(([name]) => <PlatformMark key={name} platform={name as "web" | "android" | "ios"} />)}</div></td>
                <td><strong>{total}</strong>{failures > 0 && <span className="failure-count">{failures} failed</span>}</td>
                <td><span className="time-main">{relativeTime(run.startedAt)}</span><small>{run.actor}</small></td>
                <td><Link className="icon-link" href={`/runs/${run.id}`} aria-label="Open run"><ArrowUpRight size={17} /></Link></td>
              </tr>;
            })}</tbody>
          </table>
        )}
      </section>
    </main>
  );
}
