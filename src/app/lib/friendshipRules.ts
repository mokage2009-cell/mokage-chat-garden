export type RelationshipRow = {
  applicant_login_id: string;
  target_login_id: string | null;
  status: string;
  post: { author_login_id: string } | null;
};

export function relationshipStatus(rows: RelationshipRow[], me: string, other: string): "none" | "pending" | "accepted" {
  let status: "none" | "pending" | "accepted" = "none";
  for (const row of rows) {
    const target = row.target_login_id ?? row.post?.author_login_id;
    if (!((row.applicant_login_id === me && target === other) || (row.applicant_login_id === other && target === me))) continue;
    if (row.status === "accepted") return "accepted";
    if (row.status === "pending") status = "pending";
  }
  return status;
}

export function compactPages(current: number, total: number): (number | "...")[] {
  const pages = new Set([1, total]);
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.add(i);
  const result: (number | "...")[] = [];
  let previous = 0;
  for (const page of [...pages].sort((a, b) => a - b)) {
    if (page - previous > 1) result.push("...");
    result.push(page);
    previous = page;
  }
  return result;
}