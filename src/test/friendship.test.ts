import { describe, expect, it } from "vitest";
import { compactPages, relationshipStatus } from "@/app/lib/friendshipRules";
import { adminConversationPairs } from "@/app/lib/adminChatRules";

describe("Mutual friendship", () => {
  const direct = { applicant_login_id: "A", target_login_id: "B", status: "accepted", post: null };
  it("A and B both see an accepted direct friendship", () => {
    expect(relationshipStatus([direct], "A", "B")).toBe("accepted");
    expect(relationshipStatus([direct], "B", "A")).toBe("accepted");
  });
  it("recruitment friendships are mutual too", () => {
    const recruitment = { ...direct, target_login_id: null, post: { author_login_id: "B" } };
    expect(relationshipStatus([recruitment], "B", "A")).toBe("accepted");
  });
  it("pending reverse requests cannot override an accepted friendship", () => {
    expect(relationshipStatus([{ ...direct, status: "pending", applicant_login_id: "B", target_login_id: "A" }, direct], "B", "A")).toBe("accepted");
  });
  it("removed relations allow a new request", () => {
    expect(relationshipStatus([], "A", "B")).toBe("none");
  });
});

describe("Recruitment page numbers", () => {
  it("shows 1 ... 11 12 13 14 15 ... 20 on page 13", () => {
    expect(compactPages(13, 20)).toEqual([1, "...", 11, 12, 13, 14, 15, "...", 20]);
  });
  it("keeps the first and last pages at boundaries", () => {
    expect(compactPages(1, 20)).toEqual([1, 2, 3, "...", 20]);
    expect(compactPages(20, 20)).toEqual([1, "...", 18, 19, 20]);
  });
});

describe("Admin conversations", () => {
  const relation = { id: "scope-1", post_id: null, conversation_scope_id: "scope-1", applicant_login_id: "A", target_login_id: "B", post: null };
  it("both account perspectives map to the same scope even when only A has sent a message", () => {
    expect([...adminConversationPairs("A", [relation]).get("B") ?? []]).toEqual(["scope-1"]);
    expect([...adminConversationPairs("B", [relation]).get("A") ?? []]).toEqual(["scope-1"]);
  });
  it("merges both directions of legacy duplicate friendships", () => {
    const reverse = { ...relation, id: "scope-2", conversation_scope_id: "scope-2", applicant_login_id: "B", target_login_id: "A" };
    expect([...adminConversationPairs("B", [relation, reverse]).get("A") ?? []]).toEqual(["scope-1", "scope-2"]);
    expect(adminConversationPairs("C", [relation]).size).toBe(0);
  });
  it("preserves the conversation when its recruitment post is deleted", () => {
    expect([...adminConversationPairs("B", [{ ...relation, id: "request", conversation_scope_id: "old-post" }]).get("A") ?? []]).toEqual(["old-post"]);
  });
});