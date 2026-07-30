import { SymmetricCipherVersion } from "./SymmetricCipherVersion"
import { BrandedType, TsBrand } from "../../../utils/TsUtils"
import { Nullable } from "@tutao/utils"

export interface AssociatedData {
	asBytes(cipherVersion: SymmetricCipherVersion): Uint8Array<ArrayBuffer>
}

class KeyDerivationContextBrand extends TsBrand {
	protected __brand: Nullable<never> = null
}
export type KeyDerivationContext = BrandedType<string, KeyDerivationContextBrand>
