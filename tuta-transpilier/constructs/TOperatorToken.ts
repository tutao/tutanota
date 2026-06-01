import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import { SyntaxKind } from "ts-morph"
import { Assert } from "../Constants"

export class TOperatorToken extends TConstruct {
	private operatorRaw: string
	constructor(symbolNode: TsNode) {
		super()
		Assert.isTrue(TOperatorToken.isOperatorToken(symbolNode.getKind()), "Non-operator node passed")
		this.operatorRaw = symbolNode.getText(false)
	}

	static isOperatorToken(nodeKind: SyntaxKind): boolean {
		return new Set([
			SyntaxKind.AsteriskToken,
			SyntaxKind.PlusToken,
			SyntaxKind.MinusToken,
			SyntaxKind.AmpersandToken,
			SyntaxKind.AmpersandAmpersandToken,
			SyntaxKind.EqualsEqualsEqualsToken,
			SyntaxKind.EqualsEqualsToken,
			SyntaxKind.EqualsGreaterThanToken,
			SyntaxKind.LessThanEqualsToken,
			SyntaxKind.GreaterThanEqualsToken,
		]).has(nodeKind)
	}

	generateKotlin(): ConstructOut {
		return this.operatorRaw
	}
}
