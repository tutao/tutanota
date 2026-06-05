import { ConstructOut, TConstruct, TConstructMultiple, UnitConstructOut } from "./TConstruct"
import { Signature, Type } from "ts-morph"
import * as Assert from "node:assert"
import { TargetLanguage } from "../LangTarget"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"

export const MappedPrimitiveType: Record<string, { kotlin: string; swift: string }> = Object.freeze({
	Number: { kotlin: "TsNumber", swift: "NSNumber" },
	Boolean: { kotlin: "Boolean", swift: "" },
	Array: { kotlin: "Array", swift: "" },
	String: { kotlin: "TsString", swift: "" },
	Void: { kotlin: "Unit", swift: "" },
	Record: { kotlin: "Map", swift: "" },
	Date: { kotlin: "TsDate", swift: "" },
	Error: { kotlin: "TsError", swift: "" },
	RegExp: { kotlin: "TsRegex", swift: "" },
} as const)

export class TType extends TConstruct {
	public readonly isJavascriptObject: boolean = false
	private readonly isNullable: boolean = false
	private readonly genericTypes: Array<TType> = []
	private readonly baseType: string | TType | TCallableTType

	constructor(typ: Type) {
		super()

		const apparentType = typ.getApparentType()
		this.isJavascriptObject = apparentType.isObject()
		const typeParamName = typ.isTypeParameter() ? typ.getSymbol().getName() : null
		const typeName = apparentType.getAliasSymbol()?.getName() ?? apparentType.getSymbol()?.getName() ?? typeParamName ?? null

		if (typ.isVoid()) {
			this.baseType = "Void"
		} else if (typ.isString()) {
			this.baseType = "String"
		} else if (typ.isArray()) {
			this.baseType = typ.isReadonlyArray() ? "List" : "Array"
			this.genericTypes.push(new TType(apparentType.getArrayElementType()))
		} else if (typ.isBoolean() || typ.isBooleanLiteral()) {
			this.baseType = "Boolean"
		} else if (typ.isEnum()) {
			Assert.notEqual(typeName, null, "All enum should have a name")
			this.baseType = typeName
		} else if (typ.isIntersection()) {
			throw new Error("Convert it to interface and just extend that interface instead of using intersection")
		} else if (typ.isAny()) {
			this.baseType = "ANYYYYYY"
		} else if (apparentType.getCallSignatures().length > 0) {
			Assert.equal(apparentType.getCallSignatures().length, 1, "Callable type with overload ( multiple signature ) is not supported")
			this.baseType = new TCallableTType(apparentType.getCallSignatures()[0])
		} else if (typ.isUnion() && typeName == null) {
			const unionTypes = typ.getUnionTypes()
			this.isNullable = unionTypes.some((u) => u.isNull())
			const nonNullVariants = unionTypes.filter((u) => !u.isNull())
			const restIsEnum = nonNullVariants.every((u) => u.isEnumLiteral())
			if (restIsEnum) {
				const enumBaseType = nonNullVariants[0].getBaseTypeOfLiteralType()
				Assert.equal(
					nonNullVariants.every((u) => u.getBaseTypeOfLiteralType().getSymbol() === enumBaseType.getSymbol()),
					true,
					"Do not mix multiple enum in single union type",
				)
				this.baseType = new TType(enumBaseType)
			} else if (nonNullVariants.length === 1 && this.isNullable) {
				this.baseType = new TType(nonNullVariants[0])
			} else {
				// todo: remove this branch
				this.baseType = "UnmappedUnionType"
			}
		} else if (typeName != null) {
			this.baseType = typeName
		} else {
			throw new Error("Unknown type: " + typ.getText())
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
	private readonly parameters: TConstructMultiple<TTypedIdentifier>
	private readonly returnType: TType

	constructor(callSignature: Signature) {
		super()
		this.returnType = new TType(callSignature.getReturnType())
		const inputTypes = callSignature.getParameters().map((t) => {
			const ident = new TIdentitider(t.getName())
			const dType = new TType(t.getValueDeclaration().getType())
			return new TTypedIdentifier(ident, dType)
		})
		this.parameters = new TConstructMultiple(...inputTypes)
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
		const inputTypes = this.parameters.withSeparator(",").generateKotlin()
		return `(${inputTypes}) -> ${returnType}`
	}

	generateSwift(): UnitConstructOut {
		return ``
	}
}
