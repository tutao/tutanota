import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ClassDeclaration, InterfaceDeclaration, MethodSignature, ParameterDeclaration, PropertyDeclaration, PropertySignature, ts } from "ts-morph"
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
		private readonly isOverriden: boolean,
		property: PropertyDeclaration | ParameterDeclaration | PropertySignature,
	) {
		super()
		const initializer = property.getInitializer()
		this.initializer = initializer != null ? NodeRedirector.redirectNode(initializer) : null
		this.name = new TIdentitider(property.getName())
		this.dataType = new TType(property.getType())
		this.isReadOnly = property.isReadonly()
	}

	public static outsideConstructorParam(property: PropertyDeclaration) {
		return new TClassProperty(false, property.isStatic(), property.hasOverrideKeyword(), property)
	}

	public static fromConstructorParam(property: ParameterDeclaration) {
		Assert.equal(property.isParameterProperty(), true, "Given parameter is not a property")
		return new TClassProperty(true, false, property.hasOverrideKeyword(), property)
	}

	public static fromInterfaceProperty(property: PropertySignature) {
		return new TClassProperty(false, false, false, property)
	}

	generateKotlin(): ConstructOut {
		const variableType = this.isReadOnly ? "val" : "var"
		const overriden = this.isOverriden ? "override " : ""
		const name = this.name.generateKotlin()
		const dataType = this.dataType.generateKotlin()
		if (this.initializer != null) {
			const initializer = this.initializer.generateKotlin()
			return `${overriden}${variableType} ${name}: ${dataType} = ${initializer}`
		} else {
			return `${overriden}${variableType} ${name}: ${dataType}`
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

class TInterfaceMethod extends TConstruct {
	private readonly name: TIdentitider
	private readonly arguments: TConstructMultiple<TTypedIdentifier>
	private readonly returnType: TType

	constructor(methodSignature: MethodSignature) {
		super()
		this.name = new TIdentitider(methodSignature.getName())
		this.returnType = new TType(methodSignature.getReturnType())
		const args = methodSignature.getParameters().map((p) => new TTypedIdentifier(new TIdentitider(p.getName()), new TType(p.getType())))
		this.arguments = new TConstructMultiple(...args)
	}

	generateKotlin(): ConstructOut {
		const name = this.name.generateKotlin()
		const args = this.arguments.withSeparator(",").generateKotlin()
		const returnType = this.returnType.generateKotlin()

		return `fun ${name}(${args}): ${returnType}`
	}
}
export class TInterfaceDecl extends TConstruct {
	private readonly name: TIdentitider
	private readonly visibility: TVisibility
	private readonly properties: TConstructMultiple<TClassProperty>
	private readonly methods: TConstructMultiple<TInterfaceMethod>

	constructor(interfaceDecleration: InterfaceDeclaration) {
		super()
		this.visibility = TVisibility.checkExported(interfaceDecleration)
		this.name = new TIdentitider(interfaceDecleration.getName())
		const properties = interfaceDecleration.getProperties().map((p) => TClassProperty.fromInterfaceProperty(p))
		const methods = interfaceDecleration.getMethods().map((m) => new TInterfaceMethod(m))
		this.properties = new TConstructMultiple(...properties)
		this.methods = new TConstructMultiple(...methods)
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const properties = this.properties.withSeparator("\n")
		const methods = this.methods.withSeparator("\n")
		const body = new TConstructMultiple<TConstruct>(properties, methods).withSeparator("\n").generateKotlin()
		return `${visibility} interface ${name} { ${body} }`
	}
}
