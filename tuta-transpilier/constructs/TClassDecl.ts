import { ConstructOut, TConstruct } from "./TConstruct"
import { ClassDeclaration } from "ts-morph"
import { TIdentifierFormatting, TIdentitider } from "./TIdentitider"
import { TVisibility } from "./TVisibility"

export class TClassDecl extends TConstruct {
	private name: TIdentitider
	private visibility: TVisibility

	constructor(classDeceleration: ClassDeclaration) {
		super()
		this.visibility = new TVisibility(classDeceleration)
		this.name = new TIdentitider(classDeceleration.getName())
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const body = "/** TODO **/"
		return `${visibility} class ${name} {${body}}`
	}
}
