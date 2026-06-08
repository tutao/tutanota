import { ImportDeclaration } from "ts-morph"
import { TIdentifierFormatting, TIdentitider } from "./TIdentitider"
import { ConstructOut, TConstruct } from "./TConstruct"
import path from "node:path"
import { TUTANOTA_SRC } from "../Constants"
import { COMPATIBILITY_FILE } from "../LangTarget"
import { IgnorableError } from "../errors/IgnorableError"

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

		this.namedImports = importDeclaration
			.getImportClause()
			.getNamedImports()
			.map((ident) => new TIdentitider(ident.getName()))
		this.aliasedImports = []

		if (isRelativeImport) {
			this.importKind = TImportKind.Relative
			const importedFilePath = importDeclaration.getModuleSpecifierSourceFile().getFilePath()
			const moduleSpecifierProjPath = path.relative(TUTANOTA_SRC, importedFilePath)
			this.specifierComponents = moduleSpecifierProjPath
				.replaceAll(".ts", "")
				.split("/")
				.map((c) => new TIdentitider(c).withFormattingKind(TIdentifierFormatting.VariableLike))

			if (importedFilePath === COMPATIBILITY_FILE) {
				throw new IgnorableError("No need to import platform specific compatibility file")
			}
		} else if (isExternalImport) {
			this.importKind = TImportKind.External
			this.specifierComponents = moduleSpecifier
				.replace(/^@/, "") // starting @ for external package
				.split("/")
				.map((c) => new TIdentitider(c).withFormattingKind(TIdentifierFormatting.VariableLike))
		} else if (isAbsoluteImport) {
			throw new Error("Absolute import is not allowed")
		} else {
			throw new Error("For custom-define alias, prefer to start with @tutao/")
		}
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
			"tutao.utils": "de.tutao.platformKit.utils",
			"tutao.appEnv": "de.tutao.platformKit.appEnv",
		}

		if (this.importKind === TImportKind.Relative) {
			const [layerName, moduleName] = this.specifierComponents
			return `de.tutao.${layerName.generateKotlin()}.${moduleName.generateKotlin()}`
		} else if (this.importKind === TImportKind.External) {
			const specifierSuffix = this.specifierComponents.map((sc) => sc.generateKotlin()).join(".")
			if (namedImportsMap[specifierSuffix]) {
				return namedImportsMap[specifierSuffix]
			} else {
				// todo: throw error
				// the file we want to transpile should not use external library,
				// we can extract a interface of things we use from external library and manually implement
				// them in targetLanguage. And in this file, just use that interface
				console.log("external library imported: " + specifierSuffix)
				return specifierSuffix
			}
		}
	}
}
