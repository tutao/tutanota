import {
	CallExpression,
	EnumDeclaration,
	FunctionDeclaration,
	ImportDeclaration,
	PropertySignature,
	ReturnStatement,
	SourceFile,
	ts,
	Type,
	TypeAliasDeclaration,
	VariableDeclaration,
	VariableDeclarationKind,
} from "ts-morph"
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
			"@tutao/utils": "de.tutao.utils",
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

	generateVariableDeclaration(variableStatement: VariableDeclaration): string {
		const declType = variableStatement.getVariableStatement().getDeclarationKind()
		const identifierName = this.mapFromTsIdentifier(variableStatement.getSymbol().getName())

		let [lhs, rhs] = ["", ""]
		if (declType === VariableDeclarationKind.Const) {
			lhs = `const val ${identifierName}`
		} else if (declType === VariableDeclarationKind.Let) {
			lhs = `val ${identifierName}`
		} else if (declType === VariableDeclarationKind.Using || declType === VariableDeclarationKind.AwaitUsing) {
			throw new Error("awaitUsing or Using is not supported!!")
		}

		return `${lhs} = ${rhs}`
	}

	generateFunctionDecleration(functionDecleration: FunctionDeclaration): string {
		const functionName = this.mapFromTsIdentifier(functionDecleration.getName())
		const returnType = this.mapFromTsType(functionDecleration.getReturnType())
		const functionParameters = functionDecleration
			.getParameters()
			.map((parameter) => {
				const name = this.mapFromTsIdentifier(parameter.getName())
				const paramType = this.mapFromTsType(parameter.getType())
				return `${name}: ${paramType}`
			})
			.join(",")
		const functionBody = this.joinOutputs(this.redirectNode(functionDecleration.getBody()))

		return `fun ${functionName}(${functionParameters}): ${returnType} { ${functionBody} }`
	}

	generateReturnStatement(returnStatement: ReturnStatement): string {}

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
			Number: "number",
		}
		return typesMap[typeName] ?? typeName
	}

	protected mapFromTsIdentifier(identifier: string): string {
		// todo: if identifier is a kotlin reservedName then santitize it somehow
		return identifier
	}

	private getCurrentPackageName(): string {
		return "org.tutao"
	}
}
