// ✅ Polyfill for TensorFlow.js: Workers don’t have requestAnimationFrame
if (typeof self.requestAnimationFrame === "undefined") {
	// @ts-ignore
	self.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0)
}

if (typeof self.cancelAnimationFrame === "undefined") {
	self.cancelAnimationFrame = (id: number) => clearTimeout(id)
}

// ------------------------------------------------------------

import { SpamTrainingParameters, trainModel } from "../../../mail-app/workerUtils/spamClassification/spamTrainingWorkerUtill"

export type SpamTrainingModelArtifacts = {
	modelTopology: string
	weightSpec: string
	weightData: Uint8Array
}

self.onmessage = async (message) => {
	const spamTrainingParameters: SpamTrainingParameters = message.data

	try {
		const artifacts = await trainModel(spamTrainingParameters)
		self.postMessage(artifacts)
	} catch (err) {
		console.error("Training failed inside Worker:", err)
		self.postMessage({ error: String(err) })
	}
}
