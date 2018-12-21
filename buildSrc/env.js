// USE CASE              | TARGET SERVER     | HTML FILE  | BUILD COMMAND
// local                 | location.hostname | index.html | node make
// local app             | local IP address  | app.html   | node make
// local test            | test.tutanota.com | index.html | node make test
// local test app        | test.tutanota.com | app.html   | node make test
// local prod            | mail.tutanota.com  | index.html | node make prod
// local prod app        | mail.tutanota.com  | app.html   | node make prod
// local desktop          | location.hostname | desktop.html | node make -d
// local test            | test.tutanota.com | index.html | node make test
// local test app        | test.tutanota.com | app.html   | node make test
// test desktop           | test.tutanota.com | desktop.html | node make -d test
// local prod            | mail.tutanota.com | index.html | node make prod
// prod desktop          | mail.tutanota.com | desktop.html | node make -d prod

// test and prod dist    | location.hostname | index.html | node dist
// local app dist        | local IP address  | app.html   | node dist local
// local test dist       | test.tutanota.com | index.html | node dist test
// test app dist         | test.tutanota.com | app.html   | node dist test
// test desktop dist     | test.tutanota.com | desktop.html | node dist -l test
// local prod dist       | mail.tutanota.com | index.html | node dist prod
// prod app dist         | mail.tutanota.com | app.html   | node dist prod
// prod desktop dist     | mail.tutanota.com | desktop.html | node -l dist

// Attention: The contents of this file is evaluated at compile time and not at runtime
function create(systemConfig, staticUrl, version, mode, dist, rootPathPrefix, adminTypes) {
	return {
		systemConfig,
		"staticUrl": staticUrl,
		"mode": mode != null ? mode : "Browser",
		"versionNumber": version,
		"dist": dist != null ? dist : false,
		"timeout": 20000,
		"rootPathPrefix": rootPathPrefix != null ? rootPathPrefix : "",
		"adminTypes": adminTypes ? adminTypes : []
	}
}

module.exports = {
	create
}