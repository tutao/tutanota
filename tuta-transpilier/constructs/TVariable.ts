import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ts, VariableDeclaration, VariableDeclarationKind } from "ts-morph"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TType } from "./TType"
import { NodeRedirector } from "../NodeRedirector"
import * as Assert from "node:assert"
import SyntaxKind = ts.SyntaxKind

export class TBindingPatterns extends TConstruct {
	private readonly declarationType: TVariableKind
	private readonly destructuredProperties: TConstructMultiple<TTypedIdentifier>
	private readonly initializer: TConstruct

	constructor(variableDeclaration: VariableDeclaration) {
		super()
		const declarationType = variableDeclaration.getVariableStatement().getDeclarationKind()
		if (declarationType === VariableDeclarationKind.Const) {
			this.declarationType = TVariableKind.Immutable
		} else if (declarationType === VariableDeclarationKind.Let) {
			this.declarationType = TVariableKind.Mutable
		}
		const initializer = variableDeclaration.getInitializerOrThrow("Object binding pattern should always have a initializer")
		const initializerType = initializer.getContextualType().getApparentType()
		this.initializer = NodeRedirector.redirectNode(initializer)
		const destructuredProps = variableDeclaration
			.getNameNode()
			.asKindOrThrow(SyntaxKind.ObjectBindingPattern, "only object destructuring is expected")
			.getElements()
			.map((bindingElem) => {
				Assert.equal(bindingElem.getInitializer(), null, "Default deinitializer in object destruct pattern is not supported")
				const propName = new TIdentitider(bindingElem.getName())
				const propType = initializerType.getProperty(bindingElem.getName())
			})
	}

	generateKotlin(): ConstructOut {
		return this.expandedDecls.withSeparator("\n;").generateKotlin()
	}
}

export const enum TVariableKind {
	Mutable,
	Immutable,
}

export class TVariable extends TConstruct {
	private readonly declarationType: TVariableKind
	private readonly typedIdentifier: TTypedIdentifier
	private readonly initializer: TConstruct | null = null

	constructor(variableDeclaration: VariableDeclaration) {
		super()
		const name = new TIdentitider(variableDeclaration.getSymbol().getName())
		const dataType = new TType(variableDeclaration.getType())
		this.typedIdentifier = new TTypedIdentifier(name, dataType)
		const declarationType = variableDeclaration.getVariableStatement()?.getDeclarationKind() ?? VariableDeclarationKind.Const
		if (declarationType === VariableDeclarationKind.Const) {
			this.declarationType = TVariableKind.Immutable
		} else if (declarationType === VariableDeclarationKind.Let) {
			this.declarationType = TVariableKind.Mutable
		}

		const initializer = variableDeclaration.getInitializer()
		if (initializer) {
			this.initializer = NodeRedirector.redirectNode(initializer)
		}
	}

	generateKotlin(): ConstructOut {
		let declarator: string
		if (this.declarationType === TVariableKind.Immutable) {
			declarator = `val`
		} else if (this.declarationType === TVariableKind.Mutable) {
			declarator = `var`
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
