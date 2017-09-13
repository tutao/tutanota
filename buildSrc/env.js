// USE CASE              | TARGET SERVER     | HTML FILE  | BUILD COMMAND
// local                 | location.hostname | index.html | node build
// local app             | local IP address  | app.html   | node build
// local test            | test.tutanota.com | index.html | node build test
// local test app        | test.tutanota.com | app.html   | node build test
// local prod            | mail.tutanota.com  | index.html | node build prod
// local prod app        | mail.tutanota.com  | app.html   | node build prod

// test and prod release | location.hostname | index.html | node dist
// local app release     | local IP address  | app.html   | node dist
// local test release    | test.tutanota.com | index.html | node dist test
// test app release      | test.tutanota.com | app.html   | node dist test
// local prod release    | mail.tutanota.com  | index.html | node dist prod
// prod app release      | mail.tutanota.com  | app.html   | node dist prod

// Attention: The contents of this file is evaluated at compile time and not at runtime
function create(systemConfig, staticUrl, version, mode, dist) {
	return {
		systemConfig,
		"staticUrl": staticUrl,
		"mode": mode != null ? mode : "Browser",
		"versionNumber": version,
		"dist": dist != null ? dist : false,
		"timeout": 20000,
		"rootPathPrefix": ""
	}
}

module.exports = {
	create
}