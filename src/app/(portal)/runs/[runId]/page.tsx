import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, Box, Clock3, Code2, Download, ExternalLink, FileText, Film, GitCommit, GitPullRequest, Images, Workflow } from "lucide-react";
import { PlatformMark } from "@/components/platform-mark";
import { StatusBadge } from "@/components/status-badge";
import { getRun, listArtifacts, listRuns } from "@/lib/blob-store";
import { compactSha, duration, fileSize, relativeTime } from "@/lib/format";
import { platformSchema, type Artifact, type Platform } from "@/lib/model";

export const dynamic = "force-dynamic";

function artifactUrl(artifact: Artifact) {
  return `/api/evidence/${artifact.pathname.split("/").map(encodeURIComponent).join("/")}`;
}

export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ platform?: string }>;
}) {
  const { runId } = await params;
  const selected = platformSchema.safeParse((await searchParams).platform);
  const [run, artifacts, allRuns] = await Promise.all([getRun(runId), listArtifacts(runId), listRuns()]);
  if (!run) notFound();
  const previous = allRuns.find((candidate) => candidate.id !== run.id && candidate.source === run.source && candidate.repository === run.repository && candidate.workflow === run.workflow && candidate.branch === run.branch && candidate.startedAt < run.startedAt);
  const previousArtifacts = previous ? await listArtifacts(previous.id) : [];
  const filteredArtifacts = selected.success ? artifacts.filter((artifact) => artifact.platform === selected.data) : artifacts;
  const screenshots = filteredArtifacts.filter((artifact) => artifact.kind === "screenshot");
  const videos = filteredArtifacts.filter((artifact) => artifact.kind === "video");
  const downloads = filteredArtifacts.filter((artifact) => !["screenshot", "video"].includes(artifact.kind));
  const screenshotPairs = screenshots.flatMap((current) => {
    const prior = previousArtifacts.find((artifact) => artifact.kind === "screenshot" && artifact.platform === current.platform && artifact.filename === current.filename);
    return prior ? [{ current, prior }] : [];
  });

  return (
    <main className="page-wrap detail-page">
      <Link href="/runs" className="back-link"><ArrowLeft size={15} /> All test runs</Link>
      <section className="run-hero">
        <div className="run-hero-main">
          <div className="run-kicker"><StatusBadge status={run.status} /><span>{run.repository}</span></div>
          <h1>{run.workflow} <em>{run.source === "local" ? "LOCAL" : `#${run.runNumber ?? "-"}`}</em></h1>
          <p>{run.commitMessage ?? "No commit message provided"}</p>
          <div className="run-meta"><span><GitCommit /> {compactSha(run.commitSha)}</span><span><Code2 /> {run.branch}</span><span><Clock3 /> {relativeTime(run.startedAt)}</span><span>by @{run.actor}</span>{run.localRunId && <span>{run.localRunId}</span>}{run.environment && <span>{run.environment}</span>}{run.machine && <span>{run.machine}</span>}{Object.entries(run.devices ?? {}).map(([platform, device]) => <span key={platform}>{platform}: {device}</span>)}</div>
        </div>
        <div className="action-links">
          {run.links.pullRequest && <a href={run.links.pullRequest} target="_blank" rel="noreferrer"><GitPullRequest /> PR #{run.pullRequest}<ExternalLink /></a>}
          <a href={run.links.commit} target="_blank" rel="noreferrer"><GitCommit /> Commit<ExternalLink /></a>
          {run.links.run && <a href={run.links.run} target="_blank" rel="noreferrer"><Workflow /> Actions<ExternalLink /></a>}
          {run.links.artifacts && <a href={run.links.artifacts} target="_blank" rel="noreferrer"><Box /> Artifact<ExternalLink /></a>}
        </div>
      </section>

      <section className="platform-summary">
        {(Object.entries(run.platforms) as [Platform, NonNullable<(typeof run.platforms)[Platform]>][]).map(([platform, result]) => <Link href={`?platform=${platform}`} className={`platform-card ${selected.success && selected.data === platform ? "selected" : ""}`} key={platform}>
          <div><PlatformMark platform={platform} /><StatusBadge status={result.status} /></div>
          <strong>{result.passed}<span> / {result.total}</span></strong>
          <small>{result.failed} failed · {result.skipped} skipped · {duration(result.durationMs)}</small>
        </Link>)}
        <Link href={`/runs/${run.id}`} className={`platform-card all-platforms ${!selected.success ? "selected" : ""}`}><div><span>ALL PLATFORMS</span></div><strong>{artifacts.length}</strong><small>evidence files</small></Link>
      </section>

      {run.evidenceDeletedAt ? <div className="retention-banner expired"><Archive /> <div><strong>Evidence expired</strong><span>保持期限により重い証跡は削除済みです。実行メタデータは保持されています。</span></div></div> : <div className="retention-banner"><Archive /> <div><strong>{run.retention === "normal" ? "90-day retention" : "Preserved indefinitely"}</strong><span>{run.expiresAt ? `${new Date(run.expiresAt).toLocaleDateString("ja-JP")} に証跡を削除予定` : run.retention === "release" ? "Release run" : "Manually preserved"}</span></div></div>}

      <section className="evidence-section">
        <div className="section-title"><div><Images /><span>SCREENSHOT GALLERY</span><b>{screenshots.length}</b></div></div>
        {screenshots.length ? <div className="screenshot-grid">{screenshots.map((artifact) => <a href={artifactUrl(artifact)} target="_blank" rel="noreferrer" className="shot-card" key={artifact.pathname}><div className="shot-image"><Image src={artifactUrl(artifact)} alt={artifact.filename} fill unoptimized sizes="(max-width: 800px) 100vw, 33vw" /></div><div><span>{artifact.filename}</span><small><PlatformMark platform={artifact.platform} /> {fileSize(artifact.size)}</small></div></a>)}</div> : <EmptyEvidence label="No screenshots for this selection" />}
      </section>

      <section className="evidence-section">
        <div className="section-title"><div><Film /><span>VIDEO RECORDINGS</span><b>{videos.length}</b></div></div>
        {videos.length ? <div className="video-grid">{videos.map((artifact) => <div className="video-card" key={artifact.pathname}><video controls preload="metadata"><source src={artifactUrl(artifact)} /></video><div><span>{artifact.filename}</span><small>{fileSize(artifact.size)}</small></div></div>)}</div> : <EmptyEvidence label="No videos for this selection" />}
      </section>

      <section className="evidence-section">
        <div className="section-title"><div><FileText /><span>REPORTS, TRACES & LOGS</span><b>{downloads.length}</b></div></div>
        {downloads.length ? <div className="download-list">{downloads.map((artifact) => <a href={artifactUrl(artifact)} key={artifact.pathname}><span className={`file-kind kind-${artifact.kind}`}>{artifact.kind === "html-report" ? "HTML" : artifact.kind.toUpperCase()}</span><div><strong>{artifact.filename}</strong><small><PlatformMark platform={artifact.platform} /> {fileSize(artifact.size)}</small></div><Download /></a>)}</div> : <EmptyEvidence label="No reports, traces, or logs for this selection" />}
      </section>

      <section className="evidence-section compare-section">
        <div className="section-title"><div><Workflow /><span>PREVIOUS RUN COMPARISON</span></div></div>
        {previous ? <>
          <div className="compare-card"><div><small>PREVIOUS</small><Link href={`/runs/${previous.id}`}>{previous.source === "local" ? "LOCAL" : `#${previous.runNumber ?? "-"}`}</Link><StatusBadge status={previous.status} /></div><div className="compare-line"><i /><span>same workflow + branch</span><i /></div><div><small>CURRENT</small><strong>{run.source === "local" ? "LOCAL" : `#${run.runNumber ?? "-"}`}</strong><StatusBadge status={run.status} /></div></div>
          <div className="result-diff">
            {(["web", "android", "ios"] as Platform[]).flatMap((platform) => {
              const current = run.platforms[platform];
              const prior = previous.platforms[platform];
              if (!current && !prior) return [];
              const currentFailed = current?.failed ?? 0;
              const priorFailed = prior?.failed ?? 0;
              const delta = currentFailed - priorFailed;
              return [<div key={platform}><PlatformMark platform={platform} /><span>Failed tests</span><strong>{priorFailed} <i>→</i> {currentFailed}</strong><b className={delta > 0 ? "delta-bad" : delta < 0 ? "delta-good" : "delta-same"}>{delta > 0 ? `+${delta}` : delta}</b></div>];
            })}
          </div>
          {screenshotPairs.length > 0 && <div className="visual-diff-grid">{screenshotPairs.map(({ current, prior }) => <div className="visual-diff" key={current.pathname}><div className="visual-diff-head"><span>{current.filename}</span><PlatformMark platform={current.platform} /></div><div className="visual-diff-images"><a href={artifactUrl(prior)} target="_blank" rel="noreferrer"><i>PREVIOUS</i><Image src={artifactUrl(prior)} alt={`Previous ${prior.filename}`} fill unoptimized sizes="40vw" /></a><a href={artifactUrl(current)} target="_blank" rel="noreferrer"><i>CURRENT</i><Image src={artifactUrl(current)} alt={`Current ${current.filename}`} fill unoptimized sizes="40vw" /></a></div></div>)}</div>}
        </> : <EmptyEvidence label="No previous run on this workflow and branch" />}
      </section>
    </main>
  );
}

function EmptyEvidence({ label }: { label: string }) {
  return <div className="compact-empty"><span /><p>{label}</p></div>;
}
