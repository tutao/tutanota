import { ConstructOut, TConstruct, TConstructMultiple } from "./TConstruct"
import { AsExpression, Expression, ObjectLiteralElementLike, ObjectLiteralExpression, PropertyAssignment, SyntaxKind, TypeReferenceNode } from "ts-morph"
import { TType } from "./TType"
import { TIdentitider } from "./TIdentitider"
import { NodeRedirector } from "../NodeRedirector"
import { TEmpty } from "./TEmpty"
import { TOneToOneReplacement } from "./TOneToOneReplacement"
import * as Assert from "node:assert"

class TNamedArgs extends TConstruct {
	private readonly name: TConstruct
	private readonly initializer: TConstruct

	constructor(property: ObjectLiteralElementLike) {
		super()
		if (property instanceof PropertyAssignment) {
			this.name = new TIdentitider(property.getName())
			this.initializer = NodeRedirector.redirectNode(
				property.getInitializerOrThrow("There must be a initializer for all properties in object literal expression"),
			)
		} else {
			this.name = new TEmpty()
			this.initializer = new TEmpty()
		}
	}

	generateKotlin(): ConstructOut {
		const name = this.name.generateKotlin()
		const initialize = this.initializer.generateKotlin()
		return `${name} = ${initialize}`
	}

	generateSwift(): ConstructOut {
		const name = this.name.generateSwift()
		const initialize = this.initializer.generateSwift()
		return `${name}: ${initialize}`
	}
}

class TObjLiteralExpression extends TConstruct {
	private readonly initializers: TConstructMultiple<TNamedArgs>
	constructor(
		private readonly targetType: TType,
		expression: ObjectLiteralExpression,
	) {
		super()
		const properties = expression.getProperties().map((el) => new TNamedArgs(el))
		this.initializers = new TConstructMultiple(...properties)
	}

	generateKotlin(): ConstructOut {
		const targetType = this.targetType.generateKotlin()
		const initializer = this.initializers.withSeparator(",").generateKotlin()
		return `${targetType}(${initializer})`
	}
}

export class TAsExpr extends TConstruct {
	private readonly operand: TConstruct
	private readonly asKeyword: TOneToOneReplacement
	private readonly targetType: TType
	private readonly castedToConst: boolean

	constructor(asExpression: AsExpression) {
		super()
		Assert.equal(asExpression.getChildCount(), 3, "Expected 3 token in AsExpression")
		const [operand, asKeyword, targetType] = asExpression.getChildren()

		this.targetType = new TType(operand instanceof Expression ? operand.getContextualType() : targetType.getType())
		if (operand instanceof ObjectLiteralExpression) {
			this.operand = new TObjLiteralExpression(this.targetType, operand)
		} else {
			this.operand = NodeRedirector.redirectNode(operand)
		}
		this.asKeyword = new TOneToOneReplacement(asKeyword, SyntaxKind.AsKeyword)
		// Note:
		// This can be ignored and we can just emit the `as const` casting because,
		// if typescript code is compiling, then that gurantees that this casting was respected
		// properly everywhere in rest of the code, we won't just have that gurantee by looking
		// at thet target language code.
		this.castedToConst = targetType instanceof TypeReferenceNode && targetType.getTypeName().getText() === "const"
	}

	generateKotlin(): ConstructOut {
		if (this.castedToConst) {
			return this.operand.generateKotlin()
		} else {
			return new TConstructMultiple(this.operand, this.asKeyword, this.targetType).withSeparator(" ").generateKotlin()
		}
	}
}
