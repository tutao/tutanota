global.window = undefined

function getUrls(env) {
	if (env.staticUrl) {
		const staticUrlParts = env.staticUrl.split("//")
		const apiUrl = staticUrlParts[0] + "//*.api." + staticUrlParts[1]
		return env.staticUrl + " ws" + env.staticUrl.substring(4) + " " + apiUrl
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
	<title>Mail. Done. Right. Tutanota Login &amp; Sign up for an Ad-free Mailbox</title>
	<meta name="description" content="Mail. Done. Right. Get a free mail account that does not abuse your emails for advertising. Tutanota is fast, easy, secure and free of ads.">
	<link rel="shortcut icon" type="image/x-icon" href="images/logo-favicon-152.png">
	<meta name="application-name" content="Tutanota">
	<link rel="apple-touch-icon" sizes="152x152" href="images/logo-favicon-152.png">
	<link rel="icon" sizes="192x192" href="/images/logo-favicon-192.png">
	<meta name="twitter:card" content="summary">
	<meta name="twitter:site" content="@TutanotaTeam">
	<meta name="twitter:domain" content="tutanota.com">
	<meta name="twitter:image" content="https://tutanota.com/images/share_image.png">
	<meta stream="og:site_name" content="Tutanota">
	<meta stream="og:title" content="Secure Emails Become a Breeze">
	<meta stream="og:description" content="Get your encrypted mailbox for free and show the Internet spies that you won&amp;#39;t make it easy for them! Why? Because you simply can.">
	<meta stream="og:locale" content="en_US">
	<meta stream="og:url" content="https://tutanota.com/">
	<meta stream="og:image" content="https://tutanota.com/images/share_image.png">
	<meta stream="article:publisher" content="https://www.facebook.com/tutanota">
	<meta itemprop="name" content="Secure Emails Become a Breeze.">
	<meta itemprop="description" content="Get your encrypted mailbox for free and show the Internet spies that you won&amp;#39;t make it easy for them! Why? Because you simply can.">
	<meta itemprop="image" content="https://tutanota.com/images/share_image.png">
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
			const cspContent = "default-src 'none';"
				+ " script-src 'self';"
				+ " child-src 'self';"
				+ " font-src 'self';"
				+ " img-src http: blob: data: *;"
				+ " style-src 'unsafe-inline';"
				+ "base-uri 'none';"
				+ ` connect-src 'self' ${getUrls(env)} https://tutanota.com;`

			return `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`
		} else {
			return ""
		}
	} else {
		const cspContent = "default-src * 'unsafe-inline' 'unsafe-eval';"
			+ " script-src * 'unsafe-inline' 'unsafe-eval';"
			+ " img-src * data: blob: 'unsafe-inline';"
			+ " media-src * data: blob: 'unsafe-inline';"
			+ " style-src * 'unsafe-inline';"
			+ " frame-src *;"
			+ ` connect-src 'self' 'unsafe-inline' ${getUrls(env)} ws://localhost:9001;`

		return `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`
	}
}

function renderScriptImport({src, type}) {
	const typeString = type ? ` type="${type}"` : ""
	return `<script src="${src}"${typeString} defer></script>`
}