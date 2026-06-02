import { FunctionDeclaration } from "ts-morph"
import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { NodeRedirector } from "../NodeRedirector"

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
			.map((stmt) => NodeRedirector.redirectNode(stmt))
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const parameters = this.parameters
			.map(({ identName, typeName }) => {
				const name = identName.generateKotlin()
				const typ = typeName.generateKotlin()
				return `${name}: ${typ}`
			})
			.join(" ,")
		let functionBody = new TConstructMultiple(...this.functionBody).withSeperator(";\n").generateKotlin()
		const name = this.name.generateKotlin()
		const returnType = this.returnType.generateKotlin()

		return `fun ${visibility} ${name}(${parameters}): ${returnType} { ${functionBody} }`
	}
}
