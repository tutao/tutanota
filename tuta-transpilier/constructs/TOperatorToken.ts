import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import { SyntaxKind } from "ts-morph"
import * as Assert from "node:assert"

export class TOperatorToken extends TConstruct {
	private operatorRaw: string
	constructor(symbolNode: TsNode) {
		super()
		Assert.equal(TOperatorToken.isOperatorToken(symbolNode.getKind()), true, "Non-operator node passed")
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
			SyntaxKind.OpenParenToken,
			SyntaxKind.CloseParenToken,
			SyntaxKind.BarBarToken,
			SyntaxKind.QuestionToken,
			SyntaxKind.QuestionQuestionToken,
			SyntaxKind.ThisKeyword,
			SyntaxKind.EqualsToken,
			SyntaxKind.ExclamationEqualsToken,
		]).has(nodeKind)
	}

	generateKotlin(): ConstructOut {
		if (this.operatorRaw === "===") {
			return "=="
		} else if (this.operatorRaw === "??") {
			return "?:"
		}
		return this.operatorRaw
	}
}
