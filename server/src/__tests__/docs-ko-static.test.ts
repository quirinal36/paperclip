import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  KOREAN_DOCS_ROUTE,
  mountKoreanDocsStatic,
} from "../docs-ko-static.js";

let docsDist: string;

beforeAll(async () => {
  docsDist = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-docs-ko-"));
  await fs.mkdir(path.join(docsDist, "assets"), { recursive: true });
  await fs.mkdir(path.join(docsDist, "start", "quickstart"), {
    recursive: true,
  });
  await Promise.all([
    fs.writeFile(
      path.join(docsDist, "index.html"),
      '<html lang="ko"><title>한국어 문서</title></html>',
    ),
    fs.writeFile(
      path.join(docsDist, "404.html"),
      '<html lang="ko"><title>문서 없음</title></html>',
    ),
    fs.writeFile(path.join(docsDist, "assets", "site.css"), "body{}"),
    fs.writeFile(
      path.join(docsDist, "start", "quickstart", "index.html"),
      '<html lang="ko"><h1>빠른 시작</h1></html>',
    ),
  ]);
});

afterAll(async () => {
  await fs.rm(docsDist, { recursive: true, force: true });
});

function createApp() {
  const app = express();
  mountKoreanDocsStatic(app, docsDist);
  app.get(/.*/, (_req, res) => res.status(200).send("paperclip-spa"));
  return app;
}

describe("mountKoreanDocsStatic", () => {
  it("redirects the bare mount path to its canonical trailing-slash URL", async () => {
    const response = await request(createApp()).get(
      `${KOREAN_DOCS_ROUTE}?from=menu`,
    );

    expect(response.status).toBe(308);
    expect(response.headers.location).toBe(`${KOREAN_DOCS_ROUTE}/?from=menu`);
  });

  it("serves the home page, nested pages, and static assets", async () => {
    const app = createApp();

    const home = await request(app).get(`${KOREAN_DOCS_ROUTE}/`);
    expect(home.status).toBe(200);
    expect(home.text).toContain("한국어 문서");
    expect(home.headers["cache-control"]).toBe("no-cache");

    const page = await request(app).get(
      `${KOREAN_DOCS_ROUTE}/start/quickstart/`,
    );
    expect(page.status).toBe(200);
    expect(page.text).toContain("빠른 시작");

    const asset = await request(app).get(
      `${KOREAN_DOCS_ROUTE}/assets/site.css`,
    );
    expect(asset.status).toBe(200);
    expect(asset.headers["content-type"]).toContain("text/css");
    expect(asset.headers["x-content-type-options"]).toBe("nosniff");
    expect(asset.headers["x-robots-tag"]).toBe(
      "noindex, nofollow, noarchive",
    );
  });

  it("keeps missing documentation routes out of the Paperclip SPA fallback", async () => {
    const app = createApp();
    const response = await request(app).get(
      `${KOREAN_DOCS_ROUTE}/missing-page/`,
    );

    expect(response.status).toBe(404);
    expect(response.text).toContain("문서 없음");
    expect(response.text).not.toContain("paperclip-spa");

    const traversal = await request(app).get(
      `${KOREAN_DOCS_ROUTE}/%2e%2e%2fpackage.json`,
    );
    expect(traversal.status).toBe(404);
    expect(traversal.text).not.toContain('"name"');
  });

  it("does not mount when a built documentation home is absent", async () => {
    const empty = await fs.mkdtemp(
      path.join(os.tmpdir(), "paperclip-docs-ko-empty-"),
    );
    const app = express();
    try {
      expect(mountKoreanDocsStatic(app, empty)).toBe(false);
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });
});
