import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("@/app/lib/supabase", () => ({ supabase: client }));
import { deleteFriendPost, removeFriend } from "@/app/lib/friends";

describe("Friend deletion actions", () => {
  beforeEach(() => vi.resetAllMocks());

  it("post deletion always targets the post and its author", async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ id: "post-A" }], error: null });
    const authorFilter = vi.fn().mockReturnValue({ select });
    const postFilter = vi.fn().mockReturnValue({ eq: authorFilter });
    client.from.mockReturnValue({ delete: () => ({ eq: postFilter }) });
    await deleteFriendPost("post-A", "A");
    expect(client.from).toHaveBeenCalledWith("friend_posts");
    expect(postFilter).toHaveBeenCalledWith("id", "post-A");
    expect(authorFilter).toHaveBeenCalledWith("author_login_id", "A");
  });

  it("a refused deletion is not reported as successful", async () => {
    const query = { eq: vi.fn(), select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    query.eq.mockReturnValue(query);
    client.from.mockReturnValue({ delete: () => query });
    await expect(deleteFriendPost("post-B", "A")).rejects.toThrow();
  });

  it("friend removal delegates caller verification and both directions to the protected operation", async () => {
    client.rpc.mockResolvedValue({ error: null });
    await removeFriend("B");
    expect(client.rpc).toHaveBeenCalledWith("remove_friend", { p_other_login_id: "B" });
  });
});