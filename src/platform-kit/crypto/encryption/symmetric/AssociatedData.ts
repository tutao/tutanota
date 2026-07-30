import { SymmetricCipherVersion } from "./SymmetricCipherVersion"

export interface AssociatedData {
	asBytes(cipherVersion: SymmetricCipherVersion): Uint8Array
}

export interface KeyDerivationContext {
	readonly context: string
	readonly __brand: "KeyDerivationContext"
}
