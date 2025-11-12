// --- FIX: TensorFlow.js needs requestAnimationFrame, which doesn't exist in Workers ---
if (typeof self.requestAnimationFrame === "undefined") {
	// @ts-ignore
	self.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0)
}

if (typeof self.cancelAnimationFrame === "undefined") {
	self.cancelAnimationFrame = (id: number) => clearTimeout(id)
}
// ----------------------------------------------------------------

import { dense, glorotUniform, LayersModel, sequential, tensor1d, tensor2d, withSaveHandler } from "./tensorflow-custom"
import { SpamTrainingModelArtifacts } from "./spam-training-worker-test"

export type SpamTrainingParameters = {
	vectors: number[][]
	labels: number[]
	ownerGroup: string
}

function buildModel(inputDimension: number, deterministic: boolean = false): LayersModel {
	const model = sequential()
	model.add(
		dense({
			inputShape: [inputDimension],
			units: 16,
			activation: "relu",
			kernelInitializer: deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
		}),
	)
	model.add(
		dense({
			inputShape: [16],
			units: 16,
			activation: "relu",
			kernelInitializer: deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
		}),
	)
	model.add(
		dense({
			inputShape: [16],
			units: 16,
			activation: "relu",
			kernelInitializer: deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
		}),
	)
	model.add(
		dense({
			units: 1,
			activation: "sigmoid",
			kernelInitializer: deterministic ? glorotUniform({ seed: 42 }) : glorotUniform({}),
		}),
	)
	model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] })
	return model
}

export async function trainModel({ vectors, labels }: SpamTrainingParameters): Promise<SpamTrainingModelArtifacts> {
	console.log("I am at the train mmodel...")
	const vectorDimension = vectors[0].length //TODO: maybe make this a parameters
	const xs = tensor2d(vectors, [vectors.length, vectors[0].length], undefined)
	const ys = tensor1d(labels, undefined)
	const deterministic = false // TODO: maybe turn this to a param

	const layersModel = buildModel(vectorDimension)

	const trainingStart = performance.now()
	await layersModel.fit(xs, ys, {
		epochs: 16,
		batchSize: 32,
		shuffle: !deterministic,
		callbacks: {
			onEpochEnd: async () => {}, // or omit callbacks entirely
			onBatchEnd: async (batch) => {
				await Promise.resolve()
			},
		},
		yieldEvery: "never",
	})

	const modelArtifacts = await new Promise<SpamTrainingModelArtifacts>((resolve) => {
		const saveInfo = withSaveHandler(async (artifacts: any) => {
			const modelTopology = JSON.stringify(artifacts.modelTopology)
			const weightSpec = JSON.stringify(artifacts.weightSpecs)
			const weightData = new Uint8Array(artifacts.weightData as ArrayBuffer)
			resolve({
				modelTopology,
				weightSpec,
				weightData,
			})

			return {
				modelArtifactsInfo: {
					dateSaved: new Date(),
					modelTopologyType: "JSON",
				},
			}
		})
		layersModel.save(saveInfo, undefined)
	})
	const trainingTime = performance.now() - trainingStart
	console.log("The training time " + trainingTime.toFixed(0) + " ms")

	// when using the webgl backend we need to manually dispose @tensorflow tensors
	xs.dispose()
	ys.dispose()

	return modelArtifacts
}
