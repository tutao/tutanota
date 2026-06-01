import { ConstructOut, TConstruct } from "./TConstruct"
import { CallExpression } from "ts-morph"
import { TIdentitider } from "./TIdentitider"

export class TCall extends TConstruct {
	private readonly functionName: TIdentitider
	private readonly callArguments: Array<TConstruct>

	constructor(callExpression: CallExpression) {
		super()
		this.functionName = new TIdentitider(callExpression.getExpression().getSymbol().getName())
		this.callArguments = callExpression.getArguments().map((a) => {
			// TODO:
			return new TIdentitider("something")
		})
	}

	generateKotlin(): ConstructOut {
		const functionName = this.functionName.generateKotlin()
		const callArguments = this.callArguments.map((arg) => arg.generateKotlin()).join(",")
		return `${functionName}(${callArguments})`
	}
}
