import { ConstructOut, TConstruct } from "./TConstruct"
import { Type } from "ts-morph"
import * as Assert from "node:assert"

const MappedPrimitiveType: Record<string, { kotlin: string; swift: string }> = Object.freeze({
	Number: { kotlin: "Int", swift: "" },
	Boolean: { kotlin: "Boolean", swift: "" },
	Array: { kotlin: "Array", swift: "" },
})

export class TType extends TConstruct {
	public readonly isJavascriptObject: boolean = false
	private readonly isNullable: boolean = false
	private readonly genericTypes: Array<TType> = []
	private readonly baseType: string | TType

	constructor(typ: Type) {
		super()
		const apparentType = typ.getApparentType()
		const typeName = apparentType.getAliasSymbol()?.getName() ?? apparentType.getSymbol()?.getName() ?? null
		this.isJavascriptObject = apparentType.isObject()

		if (typ.isArray()) {
			this.baseType = typ.isReadonlyArray() ? "List" : "Array"
			this.genericTypes.push(new TType(apparentType.getArrayElementType()))
		} else if (typeName != null) {
			this.baseType = typeName
		} else if (typ.isUnion()) {
			const [firstType, secondType, ...rest] = typ.getUnionTypes()
			const firstTypeIsNull = firstType.isNull() || firstType.isUndefined()
			const secondTypeIsNull = secondType.isNull() || secondType.isUndefined()
			this.isNullable = firstTypeIsNull || secondTypeIsNull

			Assert.equal(rest.length === 0 && this.isNullable, true, "Only union of type will | null is allowed")
			if (firstTypeIsNull) this.baseType = new TType(secondType)
			else if (secondTypeIsNull) this.baseType = new TType(firstType)
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
			throw new Error("Expected either TTYpe or string")
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
