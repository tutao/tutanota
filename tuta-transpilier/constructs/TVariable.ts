import { ConstructOut, TConstruct } from "./TConstruct"
import { VariableDeclaration, VariableDeclarationKind } from "ts-morph"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TType } from "./TType"
import { NodeRedirector } from "../NodeRedirector"

export class TVariable extends TConstruct {
	private readonly declarationType: VariableDeclarationKind
	private readonly typedIdentifier: TTypedIdentifier
	private readonly initializer: TConstruct | null = null

	constructor(variableDeclaration: VariableDeclaration) {
		super()
		const name = new TIdentitider(variableDeclaration.getSymbol().getName())
		const dataType = new TType(variableDeclaration.getType())
		this.typedIdentifier = new TTypedIdentifier(name, dataType)
		this.declarationType = variableDeclaration.getVariableStatement().getDeclarationKind()
		const initializer = variableDeclaration.getInitializer()
		if (initializer) {
			this.initializer = NodeRedirector.redirectNode(initializer)
		}
	}

	generateKotlin(): ConstructOut {
		let declarator: string
		if (this.declarationType === VariableDeclarationKind.Const) {
			const dataTypeIsPrimitive = this.typedIdentifier.typeName.isPrimitiveType()
			declarator = `val`
		} else if (this.declarationType === VariableDeclarationKind.Let) {
			declarator = `var`
		} else if (this.declarationType === VariableDeclarationKind.Using || this.declarationType === VariableDeclarationKind.AwaitUsing) {
			throw new Error("awaitUsing or Using is not supported!!")
		}

		const typedId = this.typedIdentifier.generateKotlin()
		if (this.initializer == null) {
			return `lateinit ${declarator} ${typedId}`
		} else {
			const rhs = this.initializer.generateKotlin()
			return `${declarator} ${typedId} = ${rhs}`
		}
	}
}
