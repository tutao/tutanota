import { ConstructOut, TConstruct } from "./TConstruct"
import { TType } from "./TType"

const reservedKeywords = {
	swift: new Set(),
	kotlin: new Set(),
}

export type TTypedIdentifier = {
	identName: TIdentitider
	typeName: TType
}

export enum TIdentifierFormatting {
	VariableLike,
	Preserve,
}

export class TIdentitider extends TConstruct {
	private readonly makeUniqIdent = "_snkm"
	private formattingKind: TIdentifierFormatting

	constructor(private readonly rawName: string) {
		super()
		this.formattingKind = TIdentifierFormatting.Preserve
	}

	withFormattingKind(kind: TIdentifierFormatting): this {
		this.formattingKind = kind
		return this
	}

	generateKotlin(): ConstructOut {
		let identifier = this.rawName
		if (reservedKeywords.kotlin.has(this.rawName)) {
			identifier += this.makeUniqIdent
		}

		if (this.formattingKind === TIdentifierFormatting.Preserve) {
			// noop
		} else if (this.formattingKind === TIdentifierFormatting.VariableLike) {
			identifier = TIdentitider.makeCamelCase(identifier)
		}

		return identifier
	}

	private static makeCamelCase(identifier: string) {
		if (!/^[A-Za-z_$][A-Za-z0-9_$]*(?:[-_][A-Za-z0-9_$]+)*$/.test(identifier)) {
			throw new Error(`Invalid identifier: ${identifier}`)
		}

		return identifier.replace(/[-_]+(.)/g, (_, ch) => ch.toUpperCase()).replace(/^[A-Z]/, (ch) => ch.toLowerCase())
	}
}
