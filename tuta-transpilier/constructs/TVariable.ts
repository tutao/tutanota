import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ts, VariableDeclaration, VariableDeclarationKind } from "ts-morph"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { TType } from "./TType"
import { NodeRedirector } from "../NodeRedirector"
import * as Assert from "node:assert"
import SyntaxKind = ts.SyntaxKind

export class TBindingPatterns extends TConstruct {
	private readonly expandedAssignments: TConstructMultiple<TVariable>

	constructor(variableDeclaration: VariableDeclaration) {
		super()
		let variableKind: TVariableKind
		const declarationKind = variableDeclaration.getVariableStatement().getDeclarationKind()
		if (declarationKind === VariableDeclarationKind.Const) {
			variableKind = TVariableKind.Immutable
		} else if (declarationKind === VariableDeclarationKind.Let) {
			variableKind = TVariableKind.Mutable
		}
		const initializerRaw = variableDeclaration.getInitializerOrThrow("Object binding pattern should always have a initializer")
		const initializerType = initializerRaw.getContextualType().getApparentType()
		const initializer = NodeRedirector.redirectNode(initializerRaw)
		const bindedElements = variableDeclaration
			.getNameNode()
			.asKindOrThrow(SyntaxKind.ObjectBindingPattern, "only object destructuring is expected")
			.getElements()
		this.expandedAssignments = new TConstructMultiple()
		for (const bindingElem of bindedElements) {
			Assert.equal(bindingElem.getInitializer(), null, "Default deinitializer in object destruct pattern is not supported")
			const propName = new TIdentitider(bindingElem.getName())
			const propType = initializerType.getProperty(bindingElem.getName()).getDeclaredType()
			const typedId = new TTypedIdentifier(propName, new TType(propType))
			const propInitializer = new TConstructMultiple(initializer, propName).withSeparator(".")
			const decl = TVariable.__fromDestructuredPattern(variableKind, typedId, propInitializer)
			this.expandedAssignments.addConstructs(decl)
		}
	}

	generateKotlin(): ConstructOut {
		return this.expandedAssignments.withSeparator("\n;").generateKotlin()
	}
}

export const enum TVariableKind {
	Mutable,
	Immutable,
}

export class TVariable extends TConstruct {
	private constructor(
		private readonly declarationType: TVariableKind,
		private readonly typedIdentifier: TTypedIdentifier,
		private readonly initializer: TConstruct | null = null,
	) {
		super()
	}

	public static new(variableDeclaration: VariableDeclaration): TVariable {
		let declarationType: TVariableKind
		const declarationKind = variableDeclaration.getVariableStatement()?.getDeclarationKind() ?? VariableDeclarationKind.Const
		if (declarationKind === VariableDeclarationKind.Const) {
			declarationType = TVariableKind.Immutable
		} else if (declarationKind === VariableDeclarationKind.Let) {
			declarationType = TVariableKind.Mutable
		}

		const typedIdentifier = new TTypedIdentifier(new TIdentitider(variableDeclaration.getSymbol().getName()), new TType(variableDeclaration.getType()))
		const initializer = variableDeclaration.getInitializer() ? NodeRedirector.redirectNode(variableDeclaration.getInitializer()) : null
		return new TVariable(declarationType, typedIdentifier, initializer)
	}

	static __fromDestructuredPattern(declarationType: TVariableKind, typedIdentifier: TTypedIdentifier, initializer: TConstruct) {
		return new TVariable(declarationType, typedIdentifier, initializer)
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
