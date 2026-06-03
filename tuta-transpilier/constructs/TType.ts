import { ConstructOut, TConstruct } from "./TConstruct"
import { Type } from "ts-morph"

const MappedPrimitiveType: Record<string, { kotlin: string; swift: string }> = Object.freeze({
	Number: { kotlin: "Int", swift: "" },
	Boolean: { kotlin: "Boolean", swift: "" },
	Array: { kotlin: "Array", swift: "" },
	String: { kotlin: "String", swift: "" },
	Void: { kotlin: "Unit", swift: "" },
})

export class TType extends TConstruct {
	public readonly isJavascriptObject: boolean = false
	private readonly isNullable: boolean = false
	private readonly genericTypes: Array<TType> = []
	private readonly baseType: string | TType

	constructor(typ: Type) {
		super()

		const apparentType = typ.getApparentType()
		const typeParamName = typ.isTypeParameter() ? typ.getSymbol().getName() : null
		const typeName = apparentType.getAliasSymbol()?.getName() ?? apparentType.getSymbol()?.getName() ?? typeParamName ?? null
		this.isJavascriptObject = apparentType.isObject()

		if (typ.isVoid()) {
			this.baseType = "Void"
		} else if (typ.isString()) {
			this.baseType = "String"
		} else if (typ.isArray()) {
			this.baseType = typ.isReadonlyArray() ? "List" : "Array"
			this.genericTypes.push(new TType(apparentType.getArrayElementType()))
		} else if (typeName != null) {
			this.baseType = typeName
		} else if (typ.isUnion()) {
			const [firstType, secondType, ...rest] = typ.getUnionTypes()
			const firstTypeIsNull = firstType.isNull() || firstType.isUndefined()
			const secondTypeIsNull = secondType.isNull() || secondType.isUndefined()
			this.isNullable = firstTypeIsNull || secondTypeIsNull

			// todo: uncomment
			// Assert.equal(rest.length === 0 && this.isNullable, true, "Only union of type will | null is allowed")
			if (firstTypeIsNull) this.baseType = new TType(secondType)
			else if (secondTypeIsNull) this.baseType = new TType(firstType)
			else {
				// todo: remove this branch
				this.baseType = "UnmappedUnionType"
			}
		} else if (typ.isAny()) {
			// todo: rmeove this branch
			this.baseType = "ANYYYYYY"
		} else {
			// todo: rmeove this branchs2
			throw new Error("Unknown type: " + typ.getText())
		}
	}

	isPrimitiveType(): boolean {
		return this.genericTypes.length === 0 && MappedPrimitiveType[this.getFinalName()] != null
	}

	public getFinalName(): string {
		if (this.baseType instanceof TType) {
			return this.baseType.getFinalName()
		} else if (typeof this.baseType === "string") {
			return this.baseType
		} else {
			throw new Error("Expected either TType or string")
		}
	}

	generateKotlin(): ConstructOut {
		let finalType = this.getFinalName()
		finalType = MappedPrimitiveType[finalType]?.kotlin ?? finalType
		if (this.genericTypes.length > 0) {
			const genericTypes = this.genericTypes.map((t) => t.generateKotlin()).join(", ")
			finalType = `${finalType}<${genericTypes}>`
		} else if (this.isNullable) {
			finalType += "?"
		}

		return finalType
	}
}
