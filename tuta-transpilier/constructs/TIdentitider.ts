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

		identifier = TIdentitider.makeCamelCase(identifier)

		return identifier
	}

	private static makeCamelCase(identifier: string) {
		if (!/^[A-Za-z_$][A-Za-z0-9_$]*(?:[-_][A-Za-z0-9_$]+)*$/.test(identifier)) {
			throw new Error(`Invalid identifier: "${identifier}"`)
		}

		return identifier.replace(/[-_]+(.)/g, (_, ch) => ch.toUpperCase()).replace(/^[A-Z]/, (ch) => ch.toLowerCase())
	}
}
