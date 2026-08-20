const API_ROOT = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(message, { status, body, method, path }) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.body = body;
    this.method = method;
    this.path = path;
  }
}

export class GitHubClient {
  constructor({ token, repository, fetchImpl = globalThis.fetch }) {
    if (!repository || !repository.includes("/")) throw new Error("repository must be owner/name");
    if (typeof fetchImpl !== "function") throw new Error("fetch is unavailable");
    this.token = token;
    this.repository = repository;
    this.fetch = fetchImpl;
  }

  repoPath(path, repository = this.repository) {
    return `/repos/${repository}${path}`;
  }

  async request(method, path, body) {
    const url = path.startsWith("http") ? path : `${API_ROOT}${path}`;
    const response = await this.fetch(url, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "code-contributing-practice",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
    if (!response.ok) {
      throw new GitHubApiError(`GitHub API ${method} ${path} failed with ${response.status}`, {
        status: response.status,
        body: payload,
        method,
        path,
      });
    }
    return payload;
  }

  get(path) { return this.request("GET", path); }
  post(path, body) { return this.request("POST", path, body); }
  patch(path, body) { return this.request("PATCH", path, body); }
  put(path, body) { return this.request("PUT", path, body); }
  delete(path) { return this.request("DELETE", path); }

  async paginate(path, { maxPages = 10 } = {}) {
    const join = path.includes("?") ? "&" : "?";
    const items = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const payload = await this.get(`${path}${join}per_page=100&page=${page}`);
      if (!Array.isArray(payload)) throw new Error(`Expected array from ${path}`);
      items.push(...payload);
      if (payload.length < 100) break;
    }
    return items;
  }

  async getRef(branch) {
    return this.get(this.repoPath(`/git/ref/heads/${encodeURIComponent(branch)}`));
  }

  async createRef(branch, sha) {
    return this.post(this.repoPath("/git/refs"), { ref: `refs/heads/${branch}`, sha });
  }

  async deleteRef(branch) {
    try {
      await this.delete(this.repoPath(`/git/refs/heads/${encodeURIComponent(branch)}`));
      return true;
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) return false;
      throw error;
    }
  }

  async commitFiles(branch, files, message) {
    const ref = await this.getRef(branch);
    const parentSha = ref.object.sha;
    const parent = await this.get(this.repoPath(`/git/commits/${parentSha}`));
    const treeItems = [];
    for (const [path, content] of Object.entries(files)) {
      const blob = await this.post(this.repoPath("/git/blobs"), {
        content: Buffer.from(content, "utf8").toString("base64"),
        encoding: "base64",
      });
      treeItems.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }
    const tree = await this.post(this.repoPath("/git/trees"), {
      base_tree: parent.tree.sha,
      tree: treeItems,
    });
    const commit = await this.post(this.repoPath("/git/commits"), {
      message,
      tree: tree.sha,
      parents: [parentSha],
    });
    await this.patch(this.repoPath(`/git/refs/heads/${encodeURIComponent(branch)}`), {
      sha: commit.sha,
      force: false,
    });
    return commit;
  }

  async getContent(path, ref, repository = this.repository) {
    const payload = await this.get(this.repoPath(`/contents/${path}?ref=${encodeURIComponent(ref)}`, repository));
    if (Array.isArray(payload) || payload.type !== "file" || payload.encoding !== "base64") {
      throw new Error(`${path} at ${ref} is not a base64 file`);
    }
    return Buffer.from(payload.content.replaceAll("\n", ""), "base64").toString("utf8");
  }

  async upsertComment(issueNumber, marker, body) {
    const comments = await this.paginate(this.repoPath(`/issues/${issueNumber}/comments`));
    const existing = comments.find((comment) => comment.user?.type === "Bot" && comment.body?.includes(marker));
    if (existing) return this.patch(this.repoPath(`/issues/comments/${existing.id}`), { body });
    return this.post(this.repoPath(`/issues/${issueNumber}/comments`), { body });
  }

  async setStatusLabel(issueNumber, nextStatus) {
    const issue = await this.get(this.repoPath(`/issues/${issueNumber}`));
    const labels = issue.labels.map((label) => label.name).filter((name) => !name.startsWith("session:"));
    if (nextStatus) labels.push(nextStatus);
    return this.put(this.repoPath(`/issues/${issueNumber}/labels`), { labels: [...new Set(labels)] });
  }
}

export function parseRepository(repository) {
  const [owner, name, ...rest] = String(repository ?? "").split("/");
  if (!owner || !name || rest.length) throw new Error("GITHUB_REPOSITORY must be owner/name");
  return { owner, name };
}
