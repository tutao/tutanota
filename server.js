'use strict'

// http2 server
const port = 9000
const root = "./" // set to . to be able to run test cases
const nodeStatic = require('node-static')
const file = new nodeStatic.Server(root, {cache: false, gzip: true});
const http = require('http')
const fs = require('fs')
const os = require('os')

const prefix = `http://localhost:${port}/build`
const distPrefix = prefix + "/dist"

const server = http.createServer(function (req, res) {
	file.serve(req, res, (err, result) => {
		//console.log("req from " + req.connection.remoteAddress)
		if (err && err.status === 404 && req.headers.accept && req.headers.accept.startsWith("text/html")) {
			console.log(req.url + " not found -> reset to root url")
			res.statusCode = 302;
			const targetUrl = req.url.startsWith(distPrefix)
				? url.substring(distPrefix.length)
				: req.url.startsWith(prefix)
					? url.substring(prefix.length)
					: req.url
			res.setHeader('Location', `${prefix}?r=${req.url.replace(/\?/g, "&")}`);
			res.end();
		} else {
			res.statusCode = 404
			res.end();
		}
	});
})


require('chokidar-socket-emitter')({app: server, path: './build', relativeTo: './build'})

console.log(`Static server for build is running on ${os.hostname()}:${port}`)
console.log("Open /build for normal builds or /build/dist for dist build")
server.listen(port)
