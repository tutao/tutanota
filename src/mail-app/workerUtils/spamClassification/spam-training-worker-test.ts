import { SpamTrainingParameters, trainModel } from "./spamTrainingWorkerUtill"

export type SpamTrainingModelArtifacts = {
	modelTopology: string
	weightSpec: string
	weightData: Uint8Array
}

self.onmessage = async (message) => {
	const spamTrainingParameters: SpamTrainingParameters = message.data
	const artifacts = await trainModel(spamTrainingParameters)
	self.postMessage(artifacts)
}
