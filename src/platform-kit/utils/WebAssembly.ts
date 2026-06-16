import { stringToUtf8Uint8Array } from "./Encoding.js"
import { downcast } from "./Utils"
import {
	AbstractMutableUint8Array,
	BooleanArgument,
	MutableUint8Array,
	NumberArgument,
	SecureFreeUint8Array,
	SecureMutableUint8Array,
	StringArgument,
	Uint8ArrayArgument,
	WebAssemblyArgument,
} from "./WebAssemblyArgument"

/**
 * General interface for WASM exports, whether from native WASM or a fallback.
 */
export interface WASMExports {
	/**
	 * Allocates a set number of bytes on the heap.
	 *
	 * This data will be permanently allocated until manually freed with free. Be careful with this function!
	 *
	 * See https://en.cppreference.com/w/c/memory/malloc
	 *
	 * @param len number of bytes
	 * @return pointer to data or 0 if allocation failed
	 */
	malloc(len: number): Ptr

	/**
	 * Frees data allocated with malloc.
	 *
	 * `what` MUST point to something allocated with malloc, or it must be 0 (which will be a no-op). Passing a pointer not allocated with malloc or a pointer
	 * that was already freed (with the exception of 0 in both cases) will result in undefined behavior. Be careful with this function!
	 *
	 * See https://en.cppreference.com/w/c/memory/free
	 *
	 * @param what data to free or 0
	 */
	free(what: Ptr): void

	/**
	 * WebAssembly memory/heap
	 */
	memory: MemoryIF
}

export async function loadWasmFromFileOrNetwork<T extends WASMExports>(wasmPath: string, baseUrl: string): Promise<T> {
	const wasmUrl = new URL(wasmPath, baseUrl)

	let instantiatedSource: WebAssembly.WebAssemblyInstantiatedSource
	if (wasmUrl.protocol === "file:") {
		const bytes = await (await import("node:fs/promises")).readFile(wasmUrl)
		instantiatedSource = await WebAssembly.instantiate(bytes)
	} else {
		const response = await fetch(wasmUrl)
		instantiatedSource = await WebAssembly.instantiateStreaming(response)
	}
	return downcast<T>(instantiatedSource.instance.exports)
}

/**
 * Call the WebAssembly function with the given arguments.
 *
 * Automatically allocates strings and buffers and frees them while passing booleans and numbers as-is.
 *
 * @param func function to call
 * @param exports WASM module instance's exports
 * @param args arguments to pass
 *
 * @return return value of the function
 */
export function callWebAssemblyFunctionWithArguments<T>(func: (...args: number[]) => T, exports: WASMExports, ...args: (WebAssemblyArgument | null)[]): T {
	const argsToPass: number[] = []
	const toFree: Ptr[] = []
	const toClear: Uint8Array[] = []
	const toOverwrite: { arrayInWASM: Uint8Array; originalBufferYouPassedIn: AbstractMutableUint8Array }[] = []

	try {
		for (const arg of args) {
			if (arg === null) {
				// `NULL` in C is equal to 0
				argsToPass.push(0)
			} else if (arg instanceof NumberArgument) {
				// These can be passed as-is
				argsToPass.push(arg.numberInput)
			} else if (arg instanceof BooleanArgument) {
				// Convert to number
				argsToPass.push(arg.booleanInput ? 1 : 0)
			} else if (arg instanceof StringArgument) {
				// Strings require null termination and copying, so we do this here
				const s = allocateStringCopy(arg.stringInput, exports, toFree)
				try {
					toClear.push(s)
					argsToPass.push(s.byteOffset)
					toFree.push(s.byteOffset)
				} catch (e) {
					exports.free(s.byteOffset)
					throw e
				}
			} else if (arg instanceof MutableUint8Array) {
				const arrayInWASM = allocateArrayCopy(arg.uint8ArrayInputOutput, exports, toFree)
				toOverwrite.push({ arrayInWASM: arrayInWASM, originalBufferYouPassedIn: arg })
				argsToPass.push(arrayInWASM.byteOffset)
			} else if (arg instanceof SecureMutableUint8Array) {
				const arrayInWASM = allocateSecureArrayCopy(arg.uint8ArrayInputOutput.uint8ArrayInput, exports, toFree, toClear)
				toOverwrite.push({ arrayInWASM: arrayInWASM, originalBufferYouPassedIn: arg })
				argsToPass.push(arrayInWASM.byteOffset)
			} else if (arg instanceof SecureFreeUint8Array) {
				const arrayInWASM = allocateSecureArrayCopy(arg.uint8ArrayInput, exports, toFree, toClear)
				argsToPass.push(arrayInWASM.byteOffset)
			} else if (arg instanceof Uint8ArrayArgument) {
				const arrayInWASM = allocateArrayCopy(arg.uint8ArrayInput, exports, toFree)
				argsToPass.push(arrayInWASM.byteOffset)
			} else {
				throw new Error(`passed an unhandled argument type ${typeof arg}`)
			}
		}
		return func(...argsToPass)
	} finally {
		// First copy back in the contents from the WASM memory to JavaScript
		for (const f of toOverwrite) {
			if (f.originalBufferYouPassedIn instanceof MutableUint8Array) {
				f.originalBufferYouPassedIn.uint8ArrayInputOutput.set(f.arrayInWASM)
			} else if (f.originalBufferYouPassedIn instanceof SecureMutableUint8Array) {
				f.originalBufferYouPassedIn.uint8ArrayInputOutput.uint8ArrayInput.set(f.arrayInWASM)
			}
		}
		// Handle secure free buffers
		for (const f of toClear) {
			f.fill(0)
		}
		// Finally free
		for (const f of toFree) {
			exports.free(f)
		}
	}
}

/**
 * Defines a pointer type
 */
export type Ptr = number

/**
 * Defines a pointer type for immutable memory
 */
export type ConstPtr = number

/**
 * Free function interface
 */
export type FreeFN = (what: Ptr) => void

/*
 * ArrayBuffer or SharedArrayBuffer that holds the raw bytes of memory
 */
export type MemoryIF = WebAssembly.Memory

/**
 * Allocate memory on the heap of the WebAssembly instance.
 *
 * Be sure to call `free` on the byteOffset when you are done!
 *
 * @param length length of data to allocate
 * @param exports WASM module instance's exports
 */
export function allocateBuffer(length: number, exports: WASMExports): Uint8Array {
	const memory = exports.memory
	const ptr = exports.malloc(length)
	if (ptr === 0) {
		throw new Error("malloc failed to allocate memory for string")
	}
	try {
		return new Uint8Array(memory.buffer, ptr, length)
	} catch (e) {
		exports.free(ptr)
		throw e
	}
}

function allocateStringCopy(str: string, exports: WASMExports, toFree: Ptr[]): Uint8Array {
	const strBytes = stringToUtf8Uint8Array(str)
	const allocationAmount = strBytes.length + 1
	let buf = allocateBuffer(allocationAmount, exports)
	try {
		buf.set(strBytes)
		buf[buf.length - 1] = 0 // null terminate after string data
		toFree.push(buf.byteOffset)
		return buf
	} catch (e) {
		exports.free(buf.byteOffset)
		throw e
	}
}

function allocateArrayCopy(arr: ArrayLike<number>, exports: WASMExports, toFree: Ptr[]): Uint8Array {
	const allocationAmount = arr.length
	let buf = allocateBuffer(allocationAmount, exports)
	try {
		buf.set(arr)
		toFree.push(buf.byteOffset)
		return buf
	} catch (e) {
		exports.free(buf.byteOffset)
		throw e
	}
}

function allocateSecureArrayCopy(arr: Uint8Array, exports: WASMExports, toFree: Ptr[], toClear: Uint8Array[]): Uint8Array {
	const arrayInWASM = allocateArrayCopy(arr, exports, toFree)
	try {
		toClear.push(arrayInWASM)
	} catch (e) {
		// on the off chance that push fails, we don't want the buffer to linger in memory
		arrayInWASM.fill(0)
		throw e
	}
	return arrayInWASM
}

type MallocFN = (len: number) => Ptr
