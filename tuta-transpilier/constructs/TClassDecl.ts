import { ConstructOut, TConstruct } from "./TConstruct"
import { ClassDeclaration } from "ts-morph"
import { TVisibility } from "./TVisibility"
import { TType } from "./TType"

export class TClassDecl extends TConstruct {
	private readonly name: TType
	private readonly visibility: TVisibility
	private readonly isAbstract: boolean
	private readonly extendedClass: TType | number
	private readonly implementedInterface: TType | number

	constructor(classDeceleration: ClassDeclaration) {
		super()
		this.visibility = new TVisibility(classDeceleration)
		this.name = new TType(classDeceleration.getType())
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const body = "/** TODO **/"
		return `${visibility} class ${name} {${body}}`
	}
}
