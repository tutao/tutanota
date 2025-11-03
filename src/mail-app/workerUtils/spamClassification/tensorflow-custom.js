// Use side-effect import to initialize WebGL backend
import "@tensorflow/tfjs-backend-webgl"

import "@tensorflow/tfjs-core/dist/register_all_gradients"

// Layers API
import { sequential, LayersModel } from "@tensorflow/tfjs-layers"
import { dense, dropout } from "@tensorflow/tfjs-layers/dist/exports_layers"
import { glorotUniform } from "@tensorflow/tfjs-layers/dist/exports_initializers"

// Core tensor ops
import { tensor2d } from "@tensorflow/tfjs-core"
import { tensor1d } from "@tensorflow/tfjs-core"
import { enableProdMode } from "@tensorflow/tfjs-core"
import { stringToHashBucketFast } from "@tensorflow/tfjs-core/dist/ops/string/string_to_hash_bucket_fast"

// IO handlers
import { withSaveHandler, fromMemory } from "@tensorflow/tfjs-core/dist/io/passthrough"
import { loadLayersModelFromIOHandler } from "@tensorflow/tfjs-layers/dist/models"

// Re-export from this file
export {
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
}
