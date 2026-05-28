import { CallExpression, EnumDeclaration, ImportDeclaration, PropertySignature, SourceFile, ts, Type, TypeAliasDeclaration } from "ts-morph"
import { CommonTarget } from "./CommonTarget.js"
import SyntaxKind = ts.SyntaxKind

export class KotlinTarget extends CommonTarget {
	protected readonly outFileExtension = ".kt"

	constructor(sourceFile: SourceFile) {
		super(sourceFile)
	}

	generateEnumDecleration(enumDefination: EnumDeclaration): string {
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

	generateCallExpression(callExpression: CallExpression): string {
		const functionName = this.mapFromTsIdentifier(callExpression.getExpression().getSymbol().getName())
		return `${functionName}()`
	}

	generateImportDecleration(importDeclaration: ImportDeclaration): string {
		const namedImportsMap = {
			"@tutao/utils": "de.tutao.util",
			"@tutao/app-env": "de.tutao.app-env",
			"node:fs": "org.kotlin.filesystem",
		}

		const moduleSpecifier = importDeclaration.getModuleSpecifier().getLiteralValue()
		const isRelativeImport = moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")
		const isAbsoluteImport = moduleSpecifier.startsWith("/")
		const isExternalImport = moduleSpecifier.startsWith("@")

		let mappedPackage: string | null = null
		if (isExternalImport) {
			mappedPackage = namedImportsMap[moduleSpecifier] ?? null
		} else if (isRelativeImport) {
			const components = moduleSpecifier.replace(".", "").replace("/", ".")
			mappedPackage = this.getCurrentPackageName() + components
		} else if (isAbsoluteImport) {
			throw new Error("Not allowed!")
		}
		const mappedNamedImports = importDeclaration
			.getImportClause()
			.getNamedImports()
			.map((ident) => ident.getName())
			.map((ident) => this.mapFromTsIdentifier(ident))
			.map((ident) => `import ${mappedPackage}.${ident}`)
		const aliasedImports = new Array<{ ident: string; alias: string }>()
			.map(({ ident, alias }) => {
				return { ident: this.mapFromTsIdentifier(ident), alias }
			})
			.map(({ ident, alias }) => `import ${mappedPackage}.${ident} as ${alias}`)

		return [...mappedNamedImports, ...aliasedImports].join("")
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

	private getCurrentPackageName(): string {
		return "org.tutao"
	}
}
