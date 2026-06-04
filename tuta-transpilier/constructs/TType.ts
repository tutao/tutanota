import { ConstructOut, TConstruct, TConstructMultiple, UnitConstructOut } from "./TConstruct"
import { Signature, Type } from "ts-morph"
import * as Assert from "node:assert"
import { TargetLanguage } from "../LangTarget"

const MappedPrimitiveType: Record<string, { kotlin: string; swift: string }> = Object.freeze({
	Number: { kotlin: "Int", swift: "" },
	Boolean: { kotlin: "Boolean", swift: "" },
	Array: { kotlin: "Array", swift: "" },
	String: { kotlin: "String", swift: "" },
	Void: { kotlin: "Unit", swift: "" },
	Record: { kotlin: "Map", swift: "" },
})

export class TType extends TConstruct {
	public readonly isJavascriptObject: boolean = false
	private readonly isNullable: boolean = false
	private readonly genericTypes: Array<TType> = []
	private readonly baseType: string | TType | TCallableTType

	constructor(typ: Type) {
		super()

		const apparentType = typ.getApparentType()
		const typeParamName = typ.isTypeParameter() ? typ.getSymbol().getName() : null
		this.isJavascriptObject = apparentType.isObject()

		if (typ.isVoid()) {
			this.baseType = "Void"
		} else if (typ.isString()) {
			this.baseType = "String"
		} else if (typ.isArray()) {
			this.baseType = typ.isReadonlyArray() ? "List" : "Array"
			this.genericTypes.push(new TType(apparentType.getArrayElementType()))
		} else if (typ.isBoolean() || typ.isBooleanLiteral()) {
			this.baseType = "Boolean"
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
		} else if (apparentType.getCallSignatures().length > 0) {
			Assert.equal(apparentType.getCallSignatures().length, 1, "Callable type with overload ( multiple signature ) is not supported")
			this.baseType = new TCallableTType(apparentType.getCallSignatures()[0])
		} else if (typ.isAny()) {
			// todo: rmeove this branch
			this.baseType = "ANYYYYYY"
		} else {
			const typeName = apparentType.getAliasSymbol()?.getName() ?? apparentType.getSymbol()?.getName() ?? typeParamName ?? null
			if (typeName != null) {
				this.baseType = typeName
			} else {
				// todo: remove this branchs2
				throw new Error("Unknown type: " + typ.getText())
			}
		}

		const typeArguments = apparentType.getAliasTypeArguments().map((t) => new TType(t))
		this.genericTypes.push(...typeArguments)
	}

	public getFinalName(targetLanguage: TargetLanguage): string {
		if (typeof this.baseType === "string") {
			return this.baseType
		} else if (this.baseType instanceof TCallableTType) {
			return this.baseType.generate(targetLanguage)
		} else if (this.baseType instanceof TType) {
			return this.baseType.getFinalName(targetLanguage)
		} else {
			throw new Error("Expected either TType or string")
		}
	}

	generateKotlin(): ConstructOut {
		let finalType = this.getFinalName(TargetLanguage.Kotlin)
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

class TCallableTType extends TConstruct {
	private readonly inputTypes: TConstructMultiple<TType>
	private readonly returnType: TType

	constructor(callSignature: Signature) {
		super()
		this.returnType = new TType(callSignature.getReturnType())
		const inputTypes = callSignature.getTypeParameters().map((t) => new TType(t))
		this.inputTypes = new TConstructMultiple(...inputTypes)
	}

	public generate(targetLanguage: TargetLanguage): UnitConstructOut {
		switch (targetLanguage) {
			case TargetLanguage.Kotlin:
				return this.generateKotlin()
			case TargetLanguage.Swift:
				return this.generateSwift()
		}
	}

	generateKotlin(): UnitConstructOut {
		const returnType = this.returnType.generateKotlin()
		const inputTypes = this.inputTypes.withSeparator(",").generateKotlin()
		return `(${inputTypes}) -> ${returnType}`
	}

	generateSwift(): UnitConstructOut {
		return ``
	}
}
