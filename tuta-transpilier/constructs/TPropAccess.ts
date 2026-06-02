import { ConstructOut, TConstruct } from "./TConstruct"
import { PropertyAccessExpression, ts } from "ts-morph"
import { NodeRedirector } from "../NodeRedirector"
import SyntaxKind = ts.SyntaxKind

export enum TSpecialPropAccess {
	ObjectFreeze,
}

export class TPropAccess extends TConstruct {
	private readonly components: Array<TConstruct>
	public readonly specialPropAccess: TSpecialPropAccess | null = null

	constructor(propertyAccess: PropertyAccessExpression) {
		super()

		this.components = propertyAccess
			.getChildren()
			.filter((v) => v.getKind() !== SyntaxKind.DotToken)
			.map((ch) => NodeRedirector.redirectNode(ch))

		if (propertyAccess.getText(false) === "Object.freeze") {
			this.specialPropAccess = TSpecialPropAccess.ObjectFreeze
		}
	}

	generateKotlin(): ConstructOut {
		return this.components.map((c) => c.generateKotlin()).join(".")
	}
}
