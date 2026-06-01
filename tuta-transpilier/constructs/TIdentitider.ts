import { ConstructOut, TConstruct } from "./TConstruct"

const reservedKeywords = {
	swift: new Set(),
	kotlin: new Set(),
}

export type TTypedIdentifier = {
	identName: TIdentitider
	typeName: TIdentitider
}

export class TIdentitider extends TConstruct {
	private readonly makeUniqIdent = "_snkm"

	constructor(private readonly rawName: string) {
		super()
	}

	generateKotlin(): ConstructOut {
		let identifier = this.rawName
		if (reservedKeywords.kotlin.has(this.rawName)) {
			identifier += this.makeUniqIdent
		}

		return identifier
	}
}
