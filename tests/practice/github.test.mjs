import assert from "node:assert/strict";
import test from "node:test";
import { GitHubApiError, GitHubClient } from "../../scripts/practice/github.mjs";

function response(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => payload === null ? "" : JSON.stringify(payload),
  };
}

test("GitHub client sends JSON without evaluating untrusted strings", async () => {
  const calls = [];
  const client = new GitHubClient({
    token: "secret-token",
    repository: "owner/repo",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(201, { id: 1 });
    },
  });
  const malicious = "$(touch /tmp/nope); `whoami`; ${HOME}";
  await client.post(client.repoPath("/issues/1/comments"), { body: malicious });
  assert.equal(JSON.parse(calls[0].options.body).body, malicious);
  assert.equal(calls[0].options.headers.Authorization, "Bearer secret-token");
  assert.ok(!calls[0].url.includes(malicious));
});

test("GitHub client reports structured API failures without token contents", async () => {
  const client = new GitHubClient({ token: "top-secret", repository: "owner/repo", fetchImpl: async () => response(403, { message: "forbidden" }) });
  await assert.rejects(client.get(client.repoPath("/issues/1")), (error) => {
    assert.ok(error instanceof GitHubApiError);
    assert.equal(error.status, 403);
    assert.doesNotMatch(error.message, /top-secret/);
    return true;
  });
});

test("pagination is bounded and stops on a short page", async () => {
  let calls = 0;
  const client = new GitHubClient({ token: "x", repository: "owner/repo", fetchImpl: async () => {
    calls += 1;
    return response(200, calls === 1 ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 100 }]);
  } });
  const items = await client.paginate(client.repoPath("/issues"));
  assert.equal(items.length, 101);
  assert.equal(calls, 2);
});
