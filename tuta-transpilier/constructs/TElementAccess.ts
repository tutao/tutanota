import { ConstructOut, TConstruct } from "./TConstruct"
import { ElementAccessExpression } from "ts-morph"
import { TType } from "./TType"
import { NodeRedirector } from "../NodeRedirector"
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
		const typeName = this.accessingType.getFinalName(TargetLanguage.Kotlin)
		const isIndexableType = ["Array", "List", "Uint8Array"].includes(typeName)
		// todo: uncomment this
		// Assert.equal(isIndexableType, true, "Indexing is only allowed in list-like. Not in: " + typeName)
		const accessingConstruct = this.accessingConstruct.generateKotlin()
		const indexKey = this.indexKey.generateKotlin()
		return `${accessingConstruct}[${indexKey}]`
	}
}
