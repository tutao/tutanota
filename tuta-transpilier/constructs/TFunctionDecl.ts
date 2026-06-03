import { BodyableNode, ConstructorDeclaration, FunctionDeclaration, MethodDeclaration, ParameteredNode, ReturnTypedNode } from "ts-morph"
import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"

export class TFunctionDecl extends TConstruct {
	private readonly returnType: TType
	private readonly parameters: Array<TTypedIdentifier>
	private readonly functionBody: Array<TConstruct>

	private constructor(
		private readonly name: TIdentitider,
		private readonly visibility: TVisibility,
		functionDeclaration: ReturnTypedNode & ParameteredNode & BodyableNode,
	) {
		super()

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

	public static fromFunction(functionDecleration: FunctionDeclaration) {
		return new TFunctionDecl(new TIdentitider(functionDecleration.getName()), TVisibility.checkExported(functionDecleration), functionDecleration)
	}

	public static fromClassMethod(methodDeclaration: MethodDeclaration) {
		return new TFunctionDecl(new TIdentitider(methodDeclaration.getName()), TVisibility.checkScope(methodDeclaration), methodDeclaration)
	}

	public static fromConstructor(constructorDecleration: ConstructorDeclaration) {
		return new TFunctionDecl(new TIdentitider("constructor"), TVisibility.checkScope(constructorDecleration), constructorDecleration)
	}

	public getFunctionParameters(): Array<TTypedIdentifier> {
		return this.parameters
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
