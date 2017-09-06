'use strict'

// http2 server
const port = 9000
const nodeStatic = require('node-static')
const file = new nodeStatic.Server('build', {cache: false, gzip: true});
const http = require('http')

var fs = require('fs');

const server = http.createServer(function (req, res) {
	file.serve(req, res, (err, result) => {
		if (err && err.status === 404) {
			console.log(req.url + " not found -> reset to root url")
			res.statusCode = 302;
			res.setHeader('Location', `http://localhost:${port}/?r=${req.url.replace(/\?/g, "&")}`);
			res.end();
		}
	});
})


require('chokidar-socket-emitter')({app: server, path: 'build', relativeTo: 'build'})

server.listen(port)
