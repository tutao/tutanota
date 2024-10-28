global.window = undefined

function getCspUrls(env) {
	// we want to have the following allowed connect-src for a given staticUrl like https://app(.local/.test).tuta.com:
	//
	// wss://app(.local/.test).tuta.com for websocket
	// http(s)://*.api(.local/.test).tuta.com for the web app
	// api://app(.local/.test).tuta.com for the mobile apps api protocol (intercepted by native part)
	// https://app(.local/.test).tuta.com for the staticUrl itself
	// https://(local./test.)tuta.com for the website
	if (env.staticUrl) {
		const url = new URL(env.staticUrl)
		const staticUrlParts = env.staticUrl.split("//")
		const apiUrl = staticUrlParts[0] + "//*.api." + staticUrlParts[1]
		const webSocketUrl = `ws${env.staticUrl.substring(4)}`
		const appApiUrl = `${env.staticUrl.replace(/^https?/, "api")}`
		const websiteUrl = env.domainConfigs[url.hostname]?.websiteBaseUrl ?? "https://tuta.com"
		return `${env.staticUrl} ${webSocketUrl} ${apiUrl} ${appApiUrl} ${websiteUrl}`
	} else {
		return ""
	}
}

/**
 * Renders the initial HTML page to bootstrap Tutanota for different environments
 */
export async function renderHtml(scripts, env) {
	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	${csp(env)}
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
	${scripts.map(renderScriptImport).join("\n\t")}
	<!-- TutanotaTags -->
	<title>${env.mode === "App" ? "Tuta Mail" : "Tuta Mail: Login &amp; Sign up for free"}</title>
	<meta name="description" content="Sign-up for Tuta Mail: Get a free email account with quantum-safe encryption and best privacy for all your emails, calendars and contacts.">
	<link rel="shortcut icon" type="image/x-icon" href="images/logo-favicon-152.png">
	<meta name="application-name" content="Tuta Mail">
	<link rel="apple-touch-icon" sizes="152x152" href="images/logo-favicon-152.png">
	<link rel="icon" sizes="192x192" href="/images/logo-favicon-192.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@TutaPrivacy">
    <meta name="twitter:domain" content="tuta.com">
    <meta name="twitter:image" content="https://tuta.com/resources/images/share-tutanota-twitter-thumbnail.png">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Tuta Mail">
    <meta property="og:title" content="Turn ON Privacy">
    <meta property="og:description"
          content="Get a free email account with quantum-safe encryption and best privacy on all your devices. Green, secure &amp; no ads!">
    <meta property="og:locale" content="en">
    <meta property="og:url" content="https://tuta.com/">
    <meta property="og:image" content="https://tuta.com/resources/images/share-tutanota-fb-thumbnail.png">
    <meta property="article:publisher" content="https://www.facebook.com/tutanota">
	<meta itemprop="name" content="Turn ON Privacy">
	<meta itemprop="description" content="Get a free email account with quantum-safe encryption and best privacy on all your devices. Green, secure &amp; no ads!">
	<meta itemprop="image" content="https://tuta.com/images/share_image.png">
	<meta name="apple-itunes-app" content="app-id=id922429609, affiliate-data=10lSfb">
</head>
<body style="background-color:transparent">
<noscript>This site requires javascript to be enabled. Please activate it in the settings of your browser.</noscript>
</body>
</html>`
}

function csp(env) {
	if (env.dist) {
		if (env.mode === "App" || env.mode === "Desktop") {
			// differences in comparison to web csp:
			// * Content Security Policies delivered via a <meta> element may not contain the frame-ancestors directive.
			const cspContent =
				"default-src 'none';" +
				" script-src 'self' 'wasm-unsafe-eval';" +
				" worker-src 'self';" +
				" frame-src 'none';" +
				" font-src 'self';" +
				" img-src http: blob: data: *;" +
				" style-src 'unsafe-inline';" +
				"base-uri 'none';" +
				` connect-src 'self' ${getCspUrls(env)};`

			return `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`
		} else {
			//  csp is in the response headers
			return ""
		}
	} else {
		const cspContent =
			"default-src * 'unsafe-inline';" +
			" script-src * 'unsafe-inline' 'wasm-unsafe-eval';" +
			" img-src * data: blob: 'unsafe-inline';" +
			" media-src * data: blob: 'unsafe-inline';" +
			" style-src * 'unsafe-inline';" +
			" frame-src *;" +
			` connect-src *;`

		return `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`
	}
}

function renderScriptImport({ src, type }) {
	const typeString = type ? ` type="${type}"` : ""
	return `<script src="${src}"${typeString} defer></script>`
}
