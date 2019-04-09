'use strict'

// http2 server
const port = 9000
const root = "./" // set to . to be able to run test cases
const nodeStatic = require('node-static')
const file = new nodeStatic.Server(root, {cache: false, gzip: true});
const http = require('http')
const fs = require('fs')
const os = require('os')
const urlModule = require('url')

const prefix = `http://localhost:${port}/build`
const distPrefix = prefix + "/dist"

const server = http.createServer(function (req, res) {
	const originalUrl = req.url
	const parsedUrl = urlModule.parse(req.url, false)
	req.url = parsedUrl.pathname
	console.log(`original: ${originalUrl} newUrl: ${req.url}`)
	file.serve(req, res, (err, result) => {
		//console.log("req from " + req.connection.remoteAddress)
		if (err && err.status === 404) {
			console.log(req.url + " not found -> reset to root url, original:", originalUrl)

			res.statusCode = 302;
			const targetUrl = req.url.startsWith(distPrefix)
				? url.substring(distPrefix.length)
				: req.url.startsWith(prefix)
					? url.substring(prefix.length)
					: req.url
			res.setHeader('Location', `${prefix}?r=${req.url.replace(/\?/g, "&")}`);
			res.end();
		}
	});
})


require('chokidar-socket-emitter')({app: server, path: './build', relativeTo: './build'})

console.log(`Static server for build is running on ${os.hostname()}:${port}`)
console.log("Open /build for normal builds or /build/dist for dist build")
server.listen(port)
