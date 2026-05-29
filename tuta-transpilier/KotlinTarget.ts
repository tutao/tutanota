import {
	CallExpression,
	EnumDeclaration,
	ExportGetableNode,
	FunctionDeclaration,
	ImportDeclaration,
	NumericLiteral,
	PropertySignature,
	SourceFile,
	StringLiteral,
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
		const visibility = this.mapVisibilitySpecifier(enumDefination)
		const members = enumDefination
			.getMembers()
			.map((member) => "\t" + member.getName())
			.join(",\n")
		const enumName = this.mapFromTsIdentifier(enumDefination.getName())

		return `${visibility} enum class ${enumName} {\n${members}\n}`
	}

	generateTypeAliasDecleration(typeAliasDeclaration: TypeAliasDeclaration): string {
		const visibility = this.mapVisibilitySpecifier(typeAliasDeclaration)
		const aliasName = this.mapFromTsIdentifier(typeAliasDeclaration.getName())
		const typeNode = typeAliasDeclaration.getTypeNodeOrThrow()
		const properties = typeNode.getDescendantsOfKind(SyntaxKind.PropertySignature).map((p) => this.getTypedProperty(p))
		const propertiesString = properties.map(({ identifier, typeName }) => identifier + ": " + typeName).join(", ")

		return `${visibility} data class ${aliasName}(${propertiesString})`
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
			const components = moduleSpecifier
				.replace("../", "") // replace directory
				.replace("./", "") // replace directory
				.split("/")
				.map((pathComponent) => this.mapFromTsIdentifier(pathComponent))
				.filter((pc) => pc !== "")
				.join(".")
			mappedPackage = this.getCurrentPackageName() + "." + components
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
		const dataType = this.mapFromTsType(variableStatement.getType().getApparentType())

		let lhs: string
		if (declType === VariableDeclarationKind.Const) {
			lhs = `const val ${identifierName}`
		} else if (declType === VariableDeclarationKind.Let) {
			lhs = `val ${identifierName}`
		} else if (declType === VariableDeclarationKind.Using || declType === VariableDeclarationKind.AwaitUsing) {
			throw new Error("awaitUsing or Using is not supported!!")
		}

		let rhs = ""
		const initializer = variableStatement.getInitializer()
		if (initializer === null) {
			return `${lhs}: ${dataType}`
		} else {
			rhs = this.joinOutputs(this.redirectNode(initializer))
		}

		return `${lhs}: ${dataType} = ${rhs}`
	}

	generateFunctionDecleration(functionDecleration: FunctionDeclaration): string {
		const visibility = this.mapVisibilitySpecifier(functionDecleration) ?? "private"
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

		return `${visibility} fun ${functionName}(${functionParameters}): ${returnType} { ${functionBody} }`
	}

	generateCallExpression(callExpression: CallExpression): string {
		const functionName = this.mapFromTsIdentifier(callExpression.getExpression().getSymbol().getName())
		const callArguments = callExpression
			.getArguments()
			.map((argument) => this.joinOutputs(this.redirectNode(argument)))
			.join(",")

		return `${functionName}(${callArguments})`
	}

	generateNumericLiteral(numericLiteral: NumericLiteral): string {
		// todo: need to check int size and for things like `e`
		return numericLiteral.getLiteralValue().toString()
	}

	protected generateStringLiteral(stringLiteral: StringLiteral): string {
		// todo: need to escape quotes?
		return `"${stringLiteral.getLiteralValue()}"`
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
			Number: "number",
		}
		return typesMap[typeName] ?? typeName
	}

	private mapVisibilitySpecifier(node: ExportGetableNode): string | null {
		if (node.isExported()) {
			return "public"
		}

		return null
	}

	protected mapFromTsIdentifier(identifier: string): string {
		// todo: if identifier is a kotlin reservedName then santitize it somehow
		return identifier
	}

	private getCurrentPackageName(): string {
		return "org.tutao"
	}
}
