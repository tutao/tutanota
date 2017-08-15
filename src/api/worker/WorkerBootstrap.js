importScripts('../../../libs/polyfill.js', '../../../libs/bluebird.min.js', '../../../libs/system.src.js')

/**
 * Receives the first message from the client and initializes the WorkerImpl to receive all future messages. Sends a response to the client on this first message.
 */
self.onmessage = function (msg) {
	var data = msg.data
	if (data.type === 'setup') {
		self.env = data.args[0]
		System.config(self.env.systemConfig)
		System.import("src/system-resolve.js")
		.then(() => System.import('systemjs-hot-reloader'))
			.then((connect) => {
				if (connect instanceof Function && location.protocol != "https:") {
					connect({
						host: location.protocol + '//' + location.hostname + ':9082',
						entries: [System.resolveSync('src/api/worker/WorkerImpl')]
					})
				}

				System.import('src/api/worker/WorkerImpl').then((workerModule) => {
					let initialRandomizerEntropy = data.args[1]
					workerModule.workerImpl.addEntropy(initialRandomizerEntropy)
					self.postMessage({id: data.id, type: 'response', value: {}})
				})
			})
			.catch(e => {
				self.postMessage({
					id: data.id, type: 'error', error: JSON.stringify({
						name: "Error",
						message: e.message,
						stack: e.stack
					})
				})
			})
	} else {
		throw new Error("worker not yet ready")
	}
}