import { BodyableNode, FunctionDeclaration, MethodDeclaration, ParameteredNode, ReturnTypedNode } from "ts-morph"
import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"

export class TFunctionDecl extends TConstruct {
	private readonly returnType: TType
	protected readonly parameters: TConstructMultiple<TTypedIdentifier>
	private readonly functionBody: TConstructMultiple

	protected constructor(
		protected readonly name: TIdentitider,
		protected readonly visibility: TVisibility,
		functionDeclaration: ReturnTypedNode & ParameteredNode & BodyableNode,
	) {
		super()
		const params = functionDeclaration.getParameters().map((param) => new TTypedIdentifier(new TIdentitider(param.getName()), new TType(param.getType())))
		const funcBody = functionDeclaration
			.getBody()
			.forEachChildAsArray()
			.map((stmt) => NodeRedirector.redirectNode(stmt))

		this.returnType = new TType(functionDeclaration.getReturnType())
		this.parameters = new TConstructMultiple(...params)
		this.functionBody = new TConstructMultiple(...funcBody)
	}

	public static new(functionDeclaration: FunctionDeclaration) {
		return new TFunctionDecl(new TIdentitider(functionDeclaration.getName()), TVisibility.checkExported(functionDeclaration), functionDeclaration)
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const parameters = this.parameters.withSeparator(",").generateKotlin()
		const functionBody = this.functionBody.withSeparator(";\n").generateKotlin()
		const name = this.name.generateKotlin()
		const returnType = this.returnType.generateKotlin()

		return `${visibility} fun ${name}(${parameters}): ${returnType} { ${functionBody} }`
	}
}

export class TClassMethod extends TFunctionDecl {
	constructor(methodDeclaration: MethodDeclaration) {
		super(new TIdentitider(methodDeclaration.getName()), TVisibility.checkScope(methodDeclaration), methodDeclaration)
	}
}
