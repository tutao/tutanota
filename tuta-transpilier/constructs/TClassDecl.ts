import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ClassDeclaration, ParameterDeclaration, PropertyDeclaration, ts } from "ts-morph"
import { TVisibility } from "./TVisibility"
import { TType } from "./TType"
import { TClassMethod } from "./TFunctionDecl"
import * as Assert from "node:assert"
import { TIdentitider, TTypedIdentifier } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"
import { TBlock } from "./TBlock"
import { SpecialCall, TCall } from "./TCall"
import SyntaxKind = ts.SyntaxKind

class TClassProperty extends TConstruct {
	private readonly initializer: TConstruct | null
	private readonly name: TIdentitider
	private readonly dataType: TType
	private readonly isReadOnly: boolean

	private constructor(
		public readonly isDefinedInConstructor: boolean,
		public readonly isStatic: boolean,
		property: PropertyDeclaration | ParameterDeclaration,
	) {
		super()
		const initializer = property.getInitializer()
		this.initializer = initializer != null ? NodeRedirector.redirectNode(initializer) : null
		this.name = new TIdentitider(property.getName())
		this.dataType = new TType(property.getType())
		this.isReadOnly = property.isReadonly()
	}

	public static outsideConstructorParam(property: PropertyDeclaration) {
		return new TClassProperty(false, property.isStatic(), property)
	}

	public static fromConstructorParam(property: ParameterDeclaration) {
		Assert.equal(property.isParameterProperty(), true, "Given parameter is not a property")
		return new TClassProperty(true, false, property)
	}

	generateKotlin(): ConstructOut {
		const variableType = this.isReadOnly ? "val" : "var"
		const name = this.name.generateKotlin()
		const dataType = this.dataType.generateKotlin()
		if (this.initializer != null) {
			const initializer = this.initializer.generateKotlin()
			return `${variableType} ${name}: ${dataType} = ${initializer}`
		} else {
			return `${variableType} ${name}: ${dataType}`
		}
	}
}

type TConstructorParam = { id: TTypedIdentifier; isProperty: boolean }
type TConstructor = { visibility: TVisibility; parameters: Array<TConstructorParam>; body: TBlock }

export class TClassDecl extends TConstruct {
	private readonly name: TType
	private readonly visibility: TVisibility
	private readonly isAbstract: boolean
	private readonly extendedClass: TType | null
	private readonly implementedInterface: TType | null
	private readonly constructorFunction: TConstructor | null
	private readonly methods: Array<TClassMethod> = []
	private readonly staticMethods: Array<TClassMethod> = []
	private readonly properties: Array<TClassProperty> = []
	private readonly staticProperties: Array<TClassProperty> = []

	constructor(classDeceleration: ClassDeclaration) {
		super()
		this.visibility = TVisibility.checkExported(classDeceleration)
		this.name = new TType(classDeceleration.getType())
		if (classDeceleration.getExtends()) {
			this.extendedClass = new TType(classDeceleration.getExtends().getType())
		}

		const allMethods = classDeceleration.getMethods().map((m) => new TClassMethod(m))
		for (const method of allMethods) {
			;(method.isStatic ? this.staticMethods : this.methods).push(method)
		}

		const allProperties = classDeceleration.getProperties().map((prop) => TClassProperty.outsideConstructorParam(prop))
		for (const property of allProperties) {
			;(property.isStatic ? this.staticProperties : this.properties).push(property)
		}

		for (const ctor of classDeceleration.getConstructors()) {
			Assert.equal(this.constructorFunction, null, "Expected one constructor at most")

			const visibility = TVisibility.checkScope(ctor)
			const body = new TBlock(ctor.getBody().asKindOrThrow(SyntaxKind.Block, "Constructor should always have atleast empty body"))

			const parameters = new Array<TConstructorParam>()
			for (const parameter of ctor.getParameters()) {
				const id = new TTypedIdentifier(new TIdentitider(parameter.getName()), new TType(parameter.getType()))
				const isProperty = parameter.isParameterProperty()
				if (isProperty) {
					this.properties.push(TClassProperty.fromConstructorParam(parameter))
				}
				parameters.push({ id, isProperty })
			}
			this.constructorFunction = { visibility, parameters, body }
		}
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const methods = new TConstructMultiple(...this.methods).withSeparator("\n").generateKotlin()
		const staticProperties = new TConstructMultiple(...this.staticProperties).withSeparator(";\n").generateKotlin()
		const staticMethods = new TConstructMultiple(...this.staticMethods).withSeparator(";\n").generateKotlin()
		const staticThings = `companion object { ${staticProperties}\n ${staticMethods} }`

		if (this.constructorFunction) {
			const properties = new TConstructMultiple(...this.properties.filter((p) => !p.isDefinedInConstructor)).withSeparator("\n").generateKotlin()
			const allSuperCalls = this.constructorFunction.body.removeStatements((construct) => {
				return construct instanceof TCall && construct.specialCall === SpecialCall.SuperCall
			})
			let superFunctionCall: TCall | null = null
			if (allSuperCalls.length > 0) {
				Assert.notEqual(this.extendedClass, null, "If superCall is found, there must be a base class")
				superFunctionCall = (allSuperCalls[0] as TCall).setBaseClassName(this.extendedClass)
			}

			const baseClassInitialization = superFunctionCall ? ` :${superFunctionCall.generateKotlin()}` : ""

			const ctorVisibility = this.constructorFunction.visibility.generateKotlin()
			const ctorParams = this.constructorFunction.parameters.map((param) => {
				const typedIdent = param.id.generateKotlin()
				return param.isProperty ? `val ${typedIdent}` : typedIdent
			})
			const ctorBody = this.constructorFunction.body.generateKotlin()
			return `${visibility} open class ${name} ${ctorVisibility} constructor (${ctorParams}) ${baseClassInitialization}\n { ${staticThings}\n ${properties}\n init ${ctorBody}\n ${methods} }`
		} else {
			const properties = new TConstructMultiple(...this.properties).withSeparator("\n").generateKotlin()
			return `${visibility} open class ${name} { ${staticThings}\n ${properties}\n ${methods} }`
		}
	}
}
