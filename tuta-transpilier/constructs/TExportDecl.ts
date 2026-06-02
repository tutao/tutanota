import { ConstructOut, TConstruct } from "./TConstruct"
import { ExportDeclaration } from "ts-morph"

export class TExportDecl extends TConstruct {
	constructor(exportDeclaration: ExportDeclaration) {
		super()
	}

	generateKotlin(): ConstructOut {
		return "/* What to do with export?*/"
	}
}
