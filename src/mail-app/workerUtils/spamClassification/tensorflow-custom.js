// Use side effect import to initialize WebGL backend
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"

import "@tensorflow/tfjs-core/dist/register_all_gradients"

// Layers API
import { LayersModel, sequential } from "@tensorflow/tfjs-layers"
import { dense, dropout } from "@tensorflow/tfjs-layers/dist/exports_layers"
import { glorotUniform } from "@tensorflow/tfjs-layers/dist/exports_initializers"

// Core tensor ops
import { enableProdMode, env, tensor1d, tensor2d } from "@tensorflow/tfjs-core"
import { stringToHashBucketFast } from "@tensorflow/tfjs-core/dist/ops/string/string_to_hash_bucket_fast"
import { PlatformStub } from "../../../../libs/tensorflow-platform-stub.js"

// IO handlers
import { fromMemory, withSaveHandler } from "@tensorflow/tfjs-core/dist/io/passthrough"
import { loadLayersModelFromIOHandler } from "@tensorflow/tfjs-layers/dist/models"

// Re-export from this file
export {
	env,
	sequential,
	LayersModel,
	dense,
	dropout,
	loadLayersModelFromIOHandler,
	glorotUniform,
	tensor2d,
	tensor1d,
	withSaveHandler,
	fromMemory,
	stringToHashBucketFast,
	enableProdMode,
	PlatformStub,
}
