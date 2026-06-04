import { ArrowFunction, BodiedNode, FunctionDeclaration, MethodDeclaration, ParameteredNode, ReturnTypedNode } from "ts-morph"
import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { TIdentifierFormatting, TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TVisibility } from "./TVisibility"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"
import { TEmpty } from "./TEmpty"

export class TFunctionDecl extends TConstruct {
	private readonly returnType: TType
	protected readonly parameters: TConstructMultiple<TTypedIdentifier>
	private readonly functionBody: TConstruct

	protected constructor(
		protected readonly name: TIdentitider,
		protected readonly visibility: TVisibility,
		functionDeclaration: ReturnTypedNode & ParameteredNode & BodiedNode,
	) {
		super()
		const params = functionDeclaration.getParameters().map((param) => new TTypedIdentifier(new TIdentitider(param.getName()), new TType(param.getType())))
		this.functionBody = NodeRedirector.redirectNode(functionDeclaration.getBody())
		this.returnType = new TType(functionDeclaration.getReturnType())
		this.parameters = new TConstructMultiple(...params)
	}

	public static new(functionDeclaration: FunctionDeclaration) {
		return new TFunctionDecl(new TIdentitider(functionDeclaration.getName()), TVisibility.checkExported(functionDeclaration), functionDeclaration)
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const parameters = this.parameters.withSeparator(",").generateKotlin()
		const functionBody = this.functionBody.generateKotlin()
		const name = this.name.generateKotlin()
		const returnType = this.returnType.generateKotlin()

		return `${visibility} fun ${name}(${parameters}): ${returnType} { ${functionBody} }`
	}
}

export class TClassMethod extends TFunctionDecl {
	public readonly isStatic: boolean
	constructor(methodDeclaration: MethodDeclaration) {
		super(new TIdentitider(methodDeclaration.getName()), TVisibility.checkScope(methodDeclaration), methodDeclaration)
		this.isStatic = methodDeclaration.isStatic()
	}
}

export class TArrow extends TFunctionDecl {
	constructor(arrowFunction: ArrowFunction) {
		const name = new TIdentitider("").withFormattingKind(TIdentifierFormatting.Preserve)
		const visibility = new TEmpty() as TVisibility
		super(name, visibility, arrowFunction)
	}
}
