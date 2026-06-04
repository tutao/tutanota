import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { PropertyAccessExpression } from "ts-morph"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"

export enum TSpecialPropAccess {
	ObjectFreeze,
}

export class TPropAccess extends TConstruct {
	private readonly propertyName: TIdentitider
	public readonly specialPropAccess: TSpecialPropAccess | null = null
	private readonly referencedObjName: TConstruct

	constructor(propertyAccess: PropertyAccessExpression) {
		super()
		this.referencedObjName = NodeRedirector.redirectNode(propertyAccess.getExpression())
		this.propertyName = new TIdentitider(propertyAccess.getName())

		if (propertyAccess.getText(false) === "Object.freeze") {
			this.specialPropAccess = TSpecialPropAccess.ObjectFreeze
		}
	}

	generateKotlin(): ConstructOut {
		return new TConstructMultiple(this.referencedObjName, this.propertyName).withSeparator(".").generateKotlin()
	}
}
