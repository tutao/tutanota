import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { TType } from "./TType"

const reservedKeywords = {
	swift: new Set(),
	kotlin: new Set(),
}

export class TTypedIdentifier extends TConstruct {
	constructor(
		public readonly identName: TIdentitider,
		public readonly typeName: TType,
	) {
		super()
	}

	generateKotlin(): ConstructOut {
		return new TConstructMultiple<TConstruct>(this.identName, this.typeName).withSeparator(": ").generateKotlin()
	}
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
		if (this.formattingKind === TIdentifierFormatting.Preserve) {
			return this.rawName
		}

		let identifier = this.rawName
		if (reservedKeywords.kotlin.has(this.rawName)) {
			identifier += this.makeUniqIdent
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
