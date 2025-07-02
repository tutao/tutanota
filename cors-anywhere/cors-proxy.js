const express = require("express")
const { createProxyMiddleware } = require("http-proxy-middleware")
const cors = require("cors")
const morgan = require("morgan")

const app = express()
const PORT = 4000

// Enable CORS for everything
app.use(cors())

// Log all requests
app.use(morgan("dev"))

// Proxy to Tutanota for anything starting with /tutanota
app.use(
	"/tutanota",
	createProxyMiddleware({
		target: "https://mail.tutanota.com",
		changeOrigin: true,
		pathRewrite: {
			"^/tutanota": "",
		},
	}),
)

// Proxy to Tutanota REST API for anything starting with /rest/tutanota
app.use(
	"/rest/tutanota",
	createProxyMiddleware({
		target: "https://mail.tutanota.com",
		changeOrigin: true,
		pathRewrite: {
			"^/rest/tutanota": "/rest/tutanota",
		},
	}),
)

// Proxy to your trusted senders backend for anything starting with /trusted
app.use(
	"/trusted",
	createProxyMiddleware({
		target: "http://localhost:3000",
		changeOrigin: true,
		pathRewrite: {
			"^/trusted": "",
		},
	}),
)

app.listen(PORT, () => {
	console.log(`🚀 CORS Proxy running at http://localhost:${PORT}`)
})
