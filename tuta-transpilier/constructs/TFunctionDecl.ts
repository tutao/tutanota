import { FunctionDeclaration } from "ts-morph"
import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"

export class TFunctionDecl extends TConstruct {
	private readonly name: TIdentitider
	private readonly returnType: TType
	private readonly parameters: Array<TTypedIdentifier>
	private readonly visibility: TVisibility
	private readonly functionBody: Array<TConstruct>

	constructor(functionDeclaration: FunctionDeclaration) {
		super()

		this.visibility = new TVisibility(functionDeclaration)
		this.name = new TIdentitider(functionDeclaration.getName())
		this.returnType = new TType(functionDeclaration.getReturnType())
		this.parameters = functionDeclaration.getParameters().map((param) => {
			const identName = new TIdentitider(param.getName())
			const typeName = new TType(param.getType())
			return { identName, typeName }
		})
		this.functionBody = functionDeclaration
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

		return `${visibility} fun ${name}(${parameters}): ${returnType} { ${functionBody} }`
	}
}
