import { ConstructOut, TConstruct } from "./TConstruct"
import { Type } from "ts-morph"
import * as Assert from "node:assert"

const MappedPrimitiveType: Record<string, { kotlin: string; swift: string }> = Object.freeze({
	Number: { kotlin: "Int", swift: "" },
	Boolean: { kotlin: "Boolean", swift: "" },
	ReadonlyArray: { kotlin: "Array", swift: "" },
})

export class TType extends TConstruct {
	private readonly isNullable: boolean
	private readonly baseType: string | TType

	constructor(typ: Type) {
		super()
		const apparentType = typ.getApparentType()
		const typeName = apparentType.getSymbol()?.getName() ?? null
		if (typeName != null) {
			this.baseType = typeName
		} else if (typ.isUnion()) {
			const [firstType, secondType, ...rest] = typ.getUnionTypes()
			this.isNullable = firstType.isNull() || secondType.isNull()
			Assert.equal(rest.length === 0 && this.isNullable, true, "Only union of type will | null is allowed")
			if (firstType.isNull()) {
				this.baseType = new TType(secondType)
			} else if (secondType.isNull()) {
				this.baseType = new TType(firstType)
			}
		}
	}

	isPrimitiveType(): boolean {
		return MappedPrimitiveType[this.getFinalName()] != null
	}

	private getFinalName(): string {
		if (this.baseType instanceof TType) {
			return this.baseType.getFinalName()
		} else if (typeof this.baseType === "string") {
			return this.baseType
		}
	}

	generateKotlin(): ConstructOut {
		const finalName = this.getFinalName()
		const mappedName = MappedPrimitiveType[finalName]?.kotlin ?? finalName
		if (this.isNullable) {
			return `${mappedName}?`
		}
		return mappedName
	}
}
