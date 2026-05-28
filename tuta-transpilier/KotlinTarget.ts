import { EnumDeclaration, PropertySignature, SourceFile, ts, Type, TypeAliasDeclaration } from "ts-morph"
import { CommonTarget } from "./CommonTarget.js"
import SyntaxKind = ts.SyntaxKind

export class KotlinTarget extends CommonTarget {
	protected readonly outFileExtension = ".kt"

	constructor(sourceFile: SourceFile) {
		super(sourceFile)
	}

	generateEnum(enumDefination: EnumDeclaration): string {
		const members = enumDefination
			.getMembers()
			.map((member) => "\t" + member.getName())
			.join(",\n")
		const enumName = this.mapFromTsIdentifier(enumDefination.getName())
		return `enum class ${enumName} {\n${members}\n}`
	}

	generateTypeAliasDecleration(typeAliasDeclaration: TypeAliasDeclaration): string {
		const aliasName = this.mapFromTsIdentifier(typeAliasDeclaration.getName())
		const typeNode = typeAliasDeclaration.getTypeNodeOrThrow()
		const properties = typeNode.getDescendantsOfKind(SyntaxKind.PropertySignature).map((p) => this.getTypedProperty(p))
		const propertiesString = properties.map(({ identifier, typeName }) => identifier + ": " + typeName).join(", ")

		return `data class ${aliasName}(${propertiesString})`
	}

	private getTypedProperty(propertySignature: PropertySignature) {
		const identifier = propertySignature.getName()
		const typeName = this.mapFromTsType(propertySignature.getType())
		return { identifier, typeName }
	}

	private mapFromTsType(typ: Type): string {
		const typeName = typ.getApparentType().getSymbol().getName()
		const typesMap = {
			Boolean: "bool",
			String: "String",
		}
		return typesMap[typeName] ?? typeName
	}

	private mapFromTsIdentifier(identifier: string): string {
		// todo: if identifier is a kotlin reservedName then santitize it somehow
		return identifier
	}
}
