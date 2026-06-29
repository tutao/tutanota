export abstract class WebAssemblyArgument {
	readonly __brand: null = null // prevent structural typing
}

export class NumberArgument extends WebAssemblyArgument {
	constructor(public numberInput: number) {
		super()
	}
}

export class BooleanArgument extends WebAssemblyArgument {
	constructor(public booleanInput: boolean) {
		super()
	}
}

export class StringArgument extends WebAssemblyArgument {
	constructor(public stringInput: string) {
		super()
	}
}

export class Uint8ArrayArgument extends WebAssemblyArgument {
	constructor(public uint8ArrayInput: Uint8Array) {
		super()
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
export class SecureFreeUint8Array extends WebAssemblyArgument {
	constructor(readonly uint8ArrayInput: Uint8Array) {
		super()
	}
}

export abstract class AbstractMutableUint8Array extends WebAssemblyArgument {
	constructor() {
		super()
	}
}

/**
 * Wrapper to be passed to a WebAssembly function.
 *
 * The contents of the array will be updated when the function finishes.
 */
export class MutableUint8Array extends AbstractMutableUint8Array {
	constructor(readonly uint8ArrayInputOutput: Uint8Array) {
		super()
	}
}

export class SecureMutableUint8Array extends AbstractMutableUint8Array {
	constructor(readonly uint8ArrayInputOutput: SecureFreeUint8Array) {
		super()
	}
}

/**
 * Convenience function for wrapping a number as a NumberArgument.
 */
export function number(value: number): NumberArgument {
	return new NumberArgument(value)
}

/**
 * Convenience function for wrapping a number as a NumberArgument.
 */
export function string(value: string): StringArgument {
	return new StringArgument(value)
}

/**
 * Convenience function for wrapping a Uint8array as a Uint8ArrayArgument.
 */
export function uint8array(array: Uint8Array): Uint8ArrayArgument {
	return new Uint8ArrayArgument(array)
}

/**
 * Convenience function for wrapping an array as a MutableUint8Array.
 *
 * Data from the WASM module will be copied back to the array once finished.
 * @param array array to wrap
 * @return wrapper
 */
export function mutable(array: Uint8Array): MutableUint8Array {
	return new MutableUint8Array(array)
}

/**
 * Convenience function for wrapping an array as a MutableUint8Array and SecureFreeUint8Array.
 *
 * Data from the WASM module will be copied back to the array once finished, and then it will be erased from the module.
 * @param array array to wrap
 * @return wrapper
 */
export function mutableSecureFree(array: Uint8Array): SecureMutableUint8Array {
	return new SecureMutableUint8Array(new SecureFreeUint8Array(array))
}

/**
 * Convenience function for wrapping an array as a MutableUint8Array and SecureFreeUint8Array.
 *
 * Data from the WASM module will be erased once finished.
 * @param array array to wrap
 * @return wrapper
 */
export function secureFree(array: Uint8Array): SecureFreeUint8Array {
	return new SecureFreeUint8Array(array)
}
