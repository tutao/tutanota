import { ConstructOut, TConstruct } from "./TConstruct"

const reservedKeywords = {
	swift: new Set(),
	kotlin: new Set(),
}

export type TTypedIdentifier = {
	identName: TIdentitider
	typeName: TIdentitider
}

export enum TIdentifierKind {
	Variable,
	GlobalConstant,
	TypeName,
}

export class TIdentitider extends TConstruct {
	private readonly makeUniqIdent = "_snkm"

	constructor(
		private readonly rawName: string,
		private readonly kind: TIdentifierKind,
	) {
		super()
	}

	generateKotlin(): ConstructOut {
		let identifier = this.rawName
		if (reservedKeywords.kotlin.has(this.rawName)) {
			identifier += this.makeUniqIdent
		}

		switch (this.kind) {
			case TIdentifierKind.GlobalConstant: {
				break
			}
			case TIdentifierKind.Variable: {
				identifier = TIdentitider.makeCamelCase(identifier)
				break
			}
			case TIdentifierKind.TypeName: {
				identifier = TIdentitider.makePascalCase(identifier)
				break
			}
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

	private static makePascalCase(identifier: string) {
		const camel = TIdentitider.makeCamelCase(identifier)
		return camel.charAt(0).toUpperCase() + camel.slice(1)
	}
}
