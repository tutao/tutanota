import { ImportDeclaration } from "ts-morph"
import { TIdentitider } from "./TIdentitider"
import { ConstructOut, TConstruct } from "./TConstruct"

export const enum TImportKind {
	Relative,
	External,
}

type AliasedImport = {
	symbol: TIdentitider
	alias: TIdentitider
}
export class TImport extends TConstruct {
	private readonly importKind: TImportKind
	private readonly namedImports: Array<TIdentitider>
	private readonly aliasedImports: Array<AliasedImport>
	private readonly specifierComponents: Array<TIdentitider>

	constructor(importDeclaration: ImportDeclaration) {
		super()
		const moduleSpecifier = importDeclaration.getModuleSpecifierValue()
		const isRelativeImport = moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")
		const isExternalImport = moduleSpecifier.startsWith("@")
		const isAbsoluteImport = moduleSpecifier.startsWith("/")

		this.specifierComponents = moduleSpecifier
			.replace(/^@/, "") // starting @ for external package
			.replace("../", "") // replace up directory
			.replace("./", "") // replace current directory
			.split("/")
			.map((c) => new TIdentitider(c))
		this.namedImports = importDeclaration
			.getImportClause()
			.getNamedImports()
			.map((ident) => new TIdentitider(ident.getName()))
		this.aliasedImports = []

		if (isRelativeImport) this.importKind = TImportKind.Relative
		else if (isExternalImport) this.importKind = TImportKind.External
		else if (isAbsoluteImport) throw new Error("Absolute import is not allowed")
		else throw new Error("For custom-define alias, prefer to start with @tutao/")
	}

	generateKotlin(): ConstructOut {
		const specifier = this.getKotlinSpecifier()
		const namedImports = this.namedImports.map((ni) => ni.generateKotlin()).map((ni) => `import ${specifier}.${ni};`)
		const aliasedImports = this.aliasedImports
			.map(({ symbol, alias }) => {
				return { symbol: symbol.generateKotlin(), alias: alias.generateKotlin() }
			})
			.map(({ symbol, alias }) => `import ${specifier}.${symbol} as ${alias};`)
		return namedImports.concat(aliasedImports).join("\n")
	}

	private getKotlinSpecifier(): string {
		const namedImportsMap = {
			"@tutao/utils": "de.tutao.utils",
			"@tutao/app-env": "de.tutao.appEnv",
		}

		const specifierSuffix = this.specifierComponents.map((sc) => sc.generateKotlin()).join(".")
		if (this.importKind === TImportKind.Relative) {
			const currentPackage = "org.tutao"
			return currentPackage + "." + specifierSuffix
		} else if (this.importKind === TImportKind.External) {
			return namedImportsMap[specifierSuffix] ?? specifierSuffix
		}
	}
}
