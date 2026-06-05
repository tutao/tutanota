import { ConstructOut, TConstruct } from "./TConstruct"
import { ElementAccessExpression } from "ts-morph"
import { TType } from "./TType"
import { NodeRedirector } from "../NodeRedirector"
import * as Assert from "node:assert"
import { TargetLanguage } from "../LangTarget"

export class TElementAccess extends TConstruct {
	private readonly accessingConstruct: TConstruct
	private readonly accessingType: TType
	private readonly indexKey: TConstruct
	constructor(elementAccess: ElementAccessExpression) {
		super()
		this.accessingType = new TType(elementAccess.getExpression().getType())
		this.accessingConstruct = NodeRedirector.redirectNode(elementAccess.getExpression())
		this.indexKey = NodeRedirector.redirectNode(elementAccess.getArgumentExpression())
	}

	generateKotlin(): ConstructOut {
		Assert.equal(this.accessingType.getFinalName(TargetLanguage.Kotlin), "Array", "Indexing is only allowed in arrays")
		const accessingConstruct = this.accessingConstruct.generateKotlin()
		const indexKey = this.indexKey.generateKotlin()
		return `${accessingConstruct}[${indexKey}]`
	}
}
