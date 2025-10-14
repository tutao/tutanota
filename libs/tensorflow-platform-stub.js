// This env import is causing a circular dependency, which we are OK with
import {env} from "@tensorflow/tfjs-core";

// We always set the platform to be PlatformBrowser
// We use a timeout to make sure the env is already initialized before setting the platform
setTimeout(() => env().setPlatform('browser', new PlatformStub()))

/**
 * @license
 * Copyright 2023 Google LLC.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
export function isTypedArrayBrowser(a) {
	return a instanceof Float32Array || a instanceof Int32Array ||
		a instanceof Uint8Array || a instanceof Uint8ClampedArray;
}

export class PlatformStub {
	constructor() {
	}

	fetch(path, init) {
		throw new Error("fetch is not supported in this build.");
	}

	now() {
		return performance.now();
	}

	encode(text, encoding) {
		if (encoding !== 'utf-8' && encoding !== 'utf8') {
			throw new Error(`Browser's encoder only supports utf-8, but got ${encoding}`);
		}
		if (this.textEncoder == null) {
			this.textEncoder = new TextEncoder();
		}
		return this.textEncoder.encode(text);
	}

	decode(bytes, encoding) {
		return new TextDecoder(encoding).decode(bytes);
	}

	setTimeoutCustom(functionRef, delay) {
		if (typeof window === 'undefined' ||
			!env().getBool('USE_SETTIMEOUTCUSTOM')) {
			setTimeout(functionRef, delay);
			return;
		}
		this.functionRefs.push(functionRef);
		setTimeout(() => {
			window.postMessage({name: this.messageName, index: this.functionRefs.length - 1}, location.origin);
		}, delay);
		if (!this.hasEventListener) {
			this.hasEventListener = true;
			window.addEventListener('message', (event) => {
				if (event.source === window && event.data.name === this.messageName) {
					event.stopPropagation();
					const functionRef = this.functionRefs[event.data.index];
					functionRef();
					this.handledMessageCount++;
					if (this.handledMessageCount === this.functionRefs.length) {
						this.functionRefs = [];
						this.handledMessageCount = 0;
					}
				}
			}, true);
		}
	}

	isTypedArray(a) {
		return isTypedArrayBrowser(a)
	}
}
