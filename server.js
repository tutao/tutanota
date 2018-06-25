'use strict'

// http2 server
const port = 9000
const nodeStatic = require('node-static')
const file = new nodeStatic.Server('build', {cache: false, gzip: true});
const http = require('http')
const fs = require('fs')
const os = require('os')

const server = http.createServer(function (req, res) {
	file.serve(req, res, (err, result) => {
		console.log("req from " + req.connection.remoteAddress)
		if (err && err.status === 404) {
			console.log(req.url + " not found -> reset to root url")
			res.statusCode = 302;
			res.setHeader('Location', `http://${os.hostname()}:${port}/?r=${req.url.replace(/\?/g, "&")}`);
			res.end();
		}
	});
})


require('chokidar-socket-emitter')({app: server, path: 'build', relativeTo: 'build'})

console.log(`Static server for build is running on ${os.hostname()}:${port}`)
server.listen(port)
