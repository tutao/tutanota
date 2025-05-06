// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "0.0.0.0"
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST)
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST)
function parseEnvList(env) {
	if (!env) {
		return []
	}
	return env.split(",")
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require("./lib/rate-limit")(process.env.CORSANYWHERE_RATELIMIT)

var cors_proxy = require("./lib/cors-anywhere")
cors_proxy
	.createServer({
		originBlacklist: originBlacklist,
		originWhitelist: ["http://localhost:9000"], //  Only allow your frontend
		requireHeader: ["origin", "x-requested-with"],
		checkRateLimit: checkRateLimit,
		removeHeaders: ["cookie", "cookie2", "x-request-start", "x-request-id", "via", "connect-time", "total-route-time"],
		redirectSameOrigin: true,
		httpProxyOptions: {
			xfwd: false,
		},
		// ✅ Key Fix: Dynamically set CORS headers
		setHeaders: function (res, req) {
			const origin = req.headers.origin
			if (origin === "http://localhost:9000") {
				res.setHeader("Access-Control-Allow-Origin", origin)
				res.setHeader("Access-Control-Allow-Credentials", "true")
			}
		},
	})
	.listen(port, host, function () {
		console.log("✅ Running CORS Anywhere on " + host + ":" + port)
	})
