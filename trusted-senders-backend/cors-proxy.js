// trusted-senders-backend/cors-proxy.js

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = 4000;

// Enable CORS for everything
app.use(cors());

// Log all requests
app.use(morgan("dev"));

// Proxy to Tutanota for anything starting with /tutanota
app.use(
  "/tutanota",
  createProxyMiddleware({
    target: "https://mail.tutanota.com", // real Tutanota server
    changeOrigin: true,
    pathRewrite: {
      "^/tutanota": "", // remove "/tutanota" prefix when forwarding
    },
  })
);

// Proxy to your trusted senders backend for anything starting with /trusted
app.use(
  "/trusted",
  createProxyMiddleware({
    target: "http://localhost:3000", // backend server
    changeOrigin: true,
    pathRewrite: {
      "^/trusted": "", // remove "/trusted" prefix when forwarding
    },
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy running at http://localhost:${PORT}`);
});
