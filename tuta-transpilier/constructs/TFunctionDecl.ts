import { FunctionDeclaration } from "ts-morph"
import { ConstructOut, TConstruct } from "./TConstruct"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { LangTarget } from "../LangTarget"

export class TFunctionDecl extends TConstruct {
	private readonly name: TIdentitider
	private readonly returnType: TIdentitider
	private readonly parameters: Array<TTypedIdentifier>
	private readonly visibility: TVisibility
	private readonly functionBody: Array<TConstruct>

	constructor(functionDecleration: FunctionDeclaration) {
		super()

		this.visibility = new TVisibility(functionDecleration)
		this.name = new TIdentitider(functionDecleration.getName())
		this.returnType = new TIdentitider(functionDecleration.getReturnType().getApparentType().getSymbol().getName())
		this.parameters = functionDecleration.getParameters().map((param) => {
			const identName = new TIdentitider(param.getName())
			const typeName = new TIdentitider(param.getType().getApparentType().getSymbol().getName())
			return { identName, typeName }
		})
		this.functionBody = functionDecleration
			.getBody()
			.forEachChildAsArray()
			.flatMap((stmt) => LangTarget.redirectNode(stmt))
	}

	generateKotlin(): ConstructOut {
		const parameters = this.parameters.map(({ identName, typeName }) => `${identName}: ${typeName}`).join(" ,")
		const functionBody = this.functionBody.map((stmt) => stmt.generateKotlin()).join(";\n")
		const name = this.name.generateKotlin()
		const returnType = this.returnType.generateKotlin()

		return `fun ${name}(${parameters}): ${returnType} { ${functionBody} }`
	}
}
