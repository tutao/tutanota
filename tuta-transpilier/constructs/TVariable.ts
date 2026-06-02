import { ConstructOut, TConstruct } from "./TConstruct"
import { VariableDeclaration, VariableDeclarationKind } from "ts-morph"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"

export class TVariable extends TConstruct {
	private readonly declarationType: VariableDeclarationKind
	private name: TIdentitider
	private dataType: TIdentitider
	private readonly initializer: TConstruct | null = null

	constructor(variableDeclaration: VariableDeclaration) {
		super()
		this.declarationType = variableDeclaration.getVariableStatement().getDeclarationKind()
		this.name = new TIdentitider(variableDeclaration.getSymbol().getName())
		this.dataType = new TIdentitider(variableDeclaration.getType().getApparentType().getSymbol().getName())
		const initializer = variableDeclaration.getInitializer()
		if (initializer) {
			this.initializer = NodeRedirector.redirectNode(initializer)
		}
	}

	generateKotlin(): ConstructOut {
		const dataType = this.dataType.generateKotlin()
		const name = this.name.generateKotlin()

		let lhs: string
		if (this.declarationType === VariableDeclarationKind.Const) {
			lhs = `const val ${name}`
		} else if (this.declarationType === VariableDeclarationKind.Let) {
			lhs = `val ${name}`
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
