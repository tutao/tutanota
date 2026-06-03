import { ConstructOut, TConstruct } from "./TConstruct"
import { SuperExpression } from "ts-morph"

export class TSuperKeyword extends TConstruct {
	constructor(superExpression: SuperExpression) {
		super()
	}

	generateKotlin(): ConstructOut {
		throw new Error("Should have been replaces to call parent class primary constructor")
	}

	generateSwift(): ConstructOut {
		return "super.init"
	}
}
