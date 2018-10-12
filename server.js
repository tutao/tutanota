'use strict'

// http2 server
const port = 9000
const root = "."
const nodeStatic = require('node-static')
const file = new nodeStatic.Server(root, {cache: false, gzip: true});
const http = require('http')
const fs = require('fs')
const os = require('os')

const prefix = `http://localhost:${port}/build`

const server = http.createServer(function (req, res) {
	file.serve(req, res, (err, result) => {
		console.log("req from " + req.connection.remoteAddress)
		if (err && err.status === 404) {
			console.log(req.url + " not found -> reset to root url")
			res.statusCode = 302;
			const targetUrl = req.url.startsWith(prefix) ? url.substring(prefix.length) : req.url
			res.setHeader('Location', `${prefix}?r=${req.url.replace(/\?/g, "&")}`);
			res.end();
		}
	});
})


require('chokidar-socket-emitter')({app: server, path: '.', relativeTo: '.'})

console.log(`Static server for build is running on ${os.hostname()}:${port}`)
console.log("Open /build for normal builds or /build/dist for dist build")
server.listen(port)
