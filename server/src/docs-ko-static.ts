import fs from "node:fs";
import path from "node:path";
import express, { type Express, type RequestHandler } from "express";

export const KOREAN_DOCS_ROUTE = "/docs-ko";

function applyPrivateDocsHeaders(
  response: { setHeader(name: string, value: string): unknown },
  html: boolean,
) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (html) response.setHeader("Cache-Control", "no-cache");
}

export function mountKoreanDocsStatic(
  app: Express,
  docsDist: string,
): boolean {
  const indexFile = path.join(docsDist, "index.html");
  if (!fs.existsSync(indexFile)) return false;

  app.get(KOREAN_DOCS_ROUTE, (req, res, next) => {
    const queryIndex = req.originalUrl.indexOf("?");
    const pathname =
      queryIndex >= 0 ? req.originalUrl.slice(0, queryIndex) : req.originalUrl;
    if (pathname !== KOREAN_DOCS_ROUTE) {
      next();
      return;
    }
    const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
    res.redirect(308, `${KOREAN_DOCS_ROUTE}/${query}`);
  });

  app.use(
    KOREAN_DOCS_ROUTE,
    express.static(docsDist, {
      index: "index.html",
      maxAge: "1h",
      setHeaders(response, filePath) {
        applyPrivateDocsHeaders(
          response,
          path.extname(filePath).toLowerCase() === ".html",
        );
      },
    }),
  );

  const notFoundFile = path.join(docsDist, "404.html");
  app.use(KOREAN_DOCS_ROUTE, ((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }

    applyPrivateDocsHeaders(res, true);
    res.status(404);
    if (!fs.existsSync(notFoundFile)) {
      res.type("text/plain").send("한국어 문서를 찾을 수 없습니다.");
      return;
    }
    res.sendFile(notFoundFile, (error) => {
      if (error) next(error);
    });
  }) as RequestHandler);

  return true;
}
