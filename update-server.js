'use strict'

// http2 server
const port = 9001
const nodeStatic = require('node-static')
const file = new nodeStatic.Server('app-desktop/dist/installers', {cache: false, gzip: true});
const http = require('http')
const fs = require('fs')
const os = require('os')

const server = http.createServer(function (req, res) {
	file.serve(req, res, (err, result) => {
		console.log("req from " + req.connection.remoteAddress)
		if (err && err.status === 404) {
			console.log(req.url + " not found")
			res.statusCode = 404;
			res.end();
		}
	});
})


require('chokidar-socket-emitter')({app: server, path: 'app-desktop/dist/installers', relativeTo: 'app-desktop/dist/installers'})

console.log(`server for desktop updates is running on ${os.hostname()}:${port}`)
server.listen(port)
