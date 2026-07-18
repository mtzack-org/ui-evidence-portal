import type { RunStatus } from "@/lib/model";

const labels: Record<RunStatus, string> = {
  queued: "QUEUED",
  running: "RUNNING",
  passed: "PASSED",
  failed: "FAILED",
  cancelled: "CANCELLED",
};

export function StatusBadge({ status }: { status: RunStatus }) {
  return <span className={`status status-${status}`}><i />{labels[status]}</span>;
}
