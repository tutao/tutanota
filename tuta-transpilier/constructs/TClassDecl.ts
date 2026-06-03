import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { ClassDeclaration, ParameterDeclaration, PropertyDeclaration } from "ts-morph"
import { TVisibility } from "./TVisibility"
import { TType } from "./TType"
import { TFunctionDecl } from "./TFunctionDecl"
import * as Assert from "node:assert"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"

class TClassProperty extends TConstruct {
	private readonly initializer: TConstruct | null
	private readonly name: TIdentitider
	private readonly dataType: TType
	private readonly isReadOnly: boolean
	constructor(property: PropertyDeclaration | ParameterDeclaration) {
		super()
		const initializer = property.getInitializer()
		this.initializer = initializer != null ? NodeRedirector.redirectNode(initializer) : null
		this.name = new TIdentitider(property.getName())
		this.dataType = new TType(property.getType())
		this.isReadOnly = property.isReadonly()
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

export class TClassDecl extends TConstruct {
	private readonly name: TType
	private readonly visibility: TVisibility
	private readonly isAbstract: boolean
	private readonly extendedClass: TType | number
	private readonly implementedInterface: TType | number
	private readonly constructorFunction: TFunctionDecl | null
	private readonly methods: Array<TFunctionDecl>
	private readonly properties: Array<TClassProperty>

	constructor(classDeceleration: ClassDeclaration) {
		super()
		this.visibility = TVisibility.checkExported(classDeceleration)
		this.name = new TType(classDeceleration.getType())
		this.methods = classDeceleration.getMethods().map((m) => TFunctionDecl.fromClassMethod(m))
		this.constructorFunction = classDeceleration.getConstructors().map((c) => TFunctionDecl.fromConstructor(c))[0] ?? null
		this.properties = classDeceleration.getProperties().map((prop) => new TClassProperty(prop))
		if (this.constructorFunction != null) {
			const propertiesDefinedInConstructor = classDeceleration
				.getConstructors()[0]
				.getParameters()
				.filter((param) => param.isParameterProperty())
				.map((param) => new TClassProperty(param))
			this.properties.push(...propertiesDefinedInConstructor)
		}

		Assert.equal(classDeceleration.getConstructors().length <= 1, true, "Expected one constructor at most")
	}

	generateKotlin(): ConstructOut {
		const visibility = this.visibility.generateKotlin()
		const name = this.name.generateKotlin()
		const properties = new TConstructMultiple(...this.properties).withSeperator(",").generateKotlin()

		const body = "/** TODO **/"
		return `${visibility} class ${name}(${properties}) {${body}}`
	}
}
