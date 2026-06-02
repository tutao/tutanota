import { ConstructOut, TConstruct } from "./TConstruct"
import { VariableDeclaration, VariableDeclarationKind } from "ts-morph"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"
import { TType } from "./TType"

export class TVariable extends TConstruct {
	private readonly declarationType: VariableDeclarationKind
	private name: TIdentitider
	private dataType: TType
	private readonly initializer: TConstruct | null = null

	constructor(variableDeclaration: VariableDeclaration) {
		super()
		this.declarationType = variableDeclaration.getVariableStatement().getDeclarationKind()
		this.name = new TIdentitider(variableDeclaration.getSymbol().getName())
		this.dataType = new TType(variableDeclaration.getType())
		const initializer = variableDeclaration.getInitializer()
		if (initializer) {
			this.initializer = NodeRedirector.redirectNode(initializer)
		}
	}

	generateKotlin(): ConstructOut {
		const dataType = this.dataType.generateKotlin()
		const name = this.name.generateKotlin()

		let lhs: string = ""
		if (this.declarationType === VariableDeclarationKind.Const) {
			if (this.dataType.isPrimitiveType()) {
				lhs = `const val ${name}`
			} else {
				lhs = `val ${name}`
			}
		} else if (this.declarationType === VariableDeclarationKind.Let) {
			lhs = `var ${name}`
		} else if (this.declarationType === VariableDeclarationKind.Using || this.declarationType === VariableDeclarationKind.AwaitUsing) {
			throw new Error("awaitUsing or Using is not supported!!")
		}

		if (this.initializer != null) {
			const rhs = this.initializer.generateKotlin()
			return `${lhs}: ${dataType} = ${rhs};`
		} else {
			return `lateinit ${lhs}: ${dataType};`
		}
	}
}
