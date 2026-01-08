import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Tentar diferentes caminhos para encontrar os arquivos estáticos
  const possiblePaths = [
    path.resolve(import.meta.dirname, "../..", "client", "dist"),  // Vite default
    path.resolve(import.meta.dirname, "..", "..", "dist", "public"), // Build customizado
    path.resolve(import.meta.dirname, "public"), // Produção (copiado)
    path.resolve("/app", "client", "dist"), // Docker path
  ];

  let distPath = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      console.log(`✅ Serving static files from: ${distPath}`);
      break;
    }
  }

  if (!fs.existsSync(distPath)) {
    console.error(
      `❌ Could not find the build directory in any of these paths:`,
      possiblePaths,
      `\nMake sure to build the client first with: pnpm build`
    );
    // Servir uma página de erro amigável
    app.use("*", (_req, res) => {
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>AVD UISA - Build Required</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
              h1 { color: #e74c3c; }
              code { background: #f4f4f4; padding: 4px 8px; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>⚠️ Build Required</h1>
            <p>The client application has not been built yet.</p>
            <p>Please run: <code>pnpm build</code></p>
            <p>Or in production: <code>npm run build</code></p>
          </body>
        </html>
      `);
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>AVD UISA - File Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
              h1 { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>❌ index.html not found</h1>
            <p>Static files directory: ${distPath}</p>
            <p>Looking for: ${indexPath}</p>
          </body>
        </html>
      `);
    }
  });
}
