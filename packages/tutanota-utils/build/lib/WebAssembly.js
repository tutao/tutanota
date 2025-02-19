import { stringToUtf8Uint8Array } from "./Encoding.js";
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
export function callWebAssemblyFunctionWithArguments(func, exports, ...args) {
    const argsToPass = [];
    const toFree = [];
    const toClear = [];
    const toOverwrite = [];
    try {
        for (const arg of args) {
            if (arg === null) {
                // `NULL` in C is equal to 0
                argsToPass.push(0);
            }
            else if (typeof arg === "number") {
                // These can be passed as-is
                argsToPass.push(arg);
            }
            else if (typeof arg === "boolean") {
                // Convert to number
                argsToPass.push(arg ? 1 : 0);
            }
            else if (typeof arg === "string") {
                // Strings require null termination and copying, so we do this here
                const s = allocateStringCopy(arg, exports, toFree);
                try {
                    toClear.push(s);
                    argsToPass.push(s.byteOffset);
                    toFree.push(s.byteOffset);
                }
                catch (e) {
                    exports.free(s.byteOffset);
                    throw e;
                }
            }
            else if (arg instanceof MutableUint8Array) {
                // Unwrap to get our original buffer back
                const inputOutput = arg.uint8ArrayInputOutput;
                let arrayInWASM;
                if (inputOutput instanceof SecureFreeUint8Array) {
                    arrayInWASM = allocateSecureArrayCopy(inputOutput.uint8ArrayInput, exports, toFree, toClear);
                }
                else {
                    arrayInWASM = allocateArrayCopy(inputOutput, exports, toFree);
                }
                toOverwrite.push({ arrayInWASM: arrayInWASM, originalBufferYouPassedIn: arg });
                argsToPass.push(arrayInWASM.byteOffset);
            }
            else if (arg instanceof SecureFreeUint8Array) {
                const arrayInWASM = allocateSecureArrayCopy(arg.uint8ArrayInput, exports, toFree, toClear);
                argsToPass.push(arrayInWASM.byteOffset);
            }
            else if (arg instanceof Uint8Array || arg instanceof Int8Array) {
                const arrayInWASM = allocateArrayCopy(arg, exports, toFree);
                argsToPass.push(arrayInWASM.byteOffset);
            }
            else {
                throw new Error(`passed an unhandled argument type ${typeof arg}`);
            }
        }
        return func(...argsToPass);
    }
    finally {
        // First copy back in the contents from the WASM memory to JavaScript
        for (const f of toOverwrite) {
            const inputOutput = f.originalBufferYouPassedIn.uint8ArrayInputOutput;
            if (inputOutput instanceof SecureFreeUint8Array) {
                inputOutput.uint8ArrayInput.set(f.arrayInWASM);
            }
            else {
                inputOutput.set(f.arrayInWASM);
            }
        }
        // Handle secure free buffers
        for (const f of toClear) {
            f.fill(0);
        }
        // Finally free
        for (const f of toFree) {
            exports.free(f);
        }
    }
}
/**
 * Allocate memory on the heap of the WebAssembly instance.
 *
 * Be sure to call `free` on the byteOffset when you are done!
 *
 * @param length length of data to allocate
 * @param exports WASM module instance's exports
 */
export function allocateBuffer(length, exports) {
    const memory = exports.memory;
    const ptr = exports.malloc(length);
    if (ptr === 0) {
        throw new Error("malloc failed to allocate memory for string");
    }
    try {
        return new Uint8Array(memory.buffer, ptr, length);
    }
    catch (e) {
        exports.free(ptr);
        throw e;
    }
}
/**
 * Wrapper to be passed to a WebAssembly function.
 *
 * The contents of the array will be updated when the function finishes.
 */
export class MutableUint8Array {
    uint8ArrayInputOutput;
    constructor(uint8ArrayInputOutput) {
        this.uint8ArrayInputOutput = uint8ArrayInputOutput;
    }
}
/**
 * Wrapper to be passed to a WebAssembly function.
 *
 * The copy allocated on the VM will be filled with zero bytes. This is slower, but it will ensure that its contents won't linger after being freed.
 *
 * Note that the buffer pointed to by uint8ArrayInput is *not* zeroed out automatically, as it is not a deep copy, so remember to zero out the original buffer
 * when you are done with it, too!
 */
export class SecureFreeUint8Array {
    uint8ArrayInput;
    constructor(uint8ArrayInput) {
        this.uint8ArrayInput = uint8ArrayInput;
    }
}
/**
 * Convenience function for wrapping an array as a MutableUint8Array.
 *
 * Data from the WASM module will be copied back to the array once finished.
 * @param array array to wrap
 * @return wrapper
 */
export function mutable(array) {
    return new MutableUint8Array(array);
}
/**
 * Convenience function for wrapping an array as a MutableUint8Array and SecureFreeUint8Array.
 *
 * Data from the WASM module will be copied back to the array once finished, and then it will be erased from the module.
 * @param array array to wrap
 * @return wrapper
 */
export function mutableSecureFree(array) {
    return new MutableUint8Array(new SecureFreeUint8Array(array));
}
/**
 * Convenience function for wrapping an array as a MutableUint8Array and SecureFreeUint8Array.
 *
 * Data from the WASM module will be erased once finished.
 * @param array array to wrap
 * @return wrapper
 */
export function secureFree(array) {
    return new SecureFreeUint8Array(array);
}
function allocateStringCopy(str, exports, toFree) {
    const strBytes = stringToUtf8Uint8Array(str);
    const allocationAmount = strBytes.length + 1;
    let buf = allocateBuffer(allocationAmount, exports);
    try {
        buf.set(strBytes);
        buf[buf.length - 1] = 0; // null terminate after string data
        toFree.push(buf.byteOffset);
        return buf;
    }
    catch (e) {
        exports.free(buf.byteOffset);
        throw e;
    }
}
function allocateArrayCopy(arr, exports, toFree) {
    const allocationAmount = arr.length;
    let buf = allocateBuffer(allocationAmount, exports);
    try {
        buf.set(arr);
        toFree.push(buf.byteOffset);
        return buf;
    }
    catch (e) {
        exports.free(buf.byteOffset);
        throw e;
    }
}
function allocateSecureArrayCopy(arr, exports, toFree, toClear) {
    const arrayInWASM = allocateArrayCopy(arr, exports, toFree);
    try {
        toClear.push(arrayInWASM);
    }
    catch (e) {
        // on the off chance that push fails, we don't want the buffer to linger in memory
        arrayInWASM.fill(0);
        throw e;
    }
    return arrayInWASM;
}
