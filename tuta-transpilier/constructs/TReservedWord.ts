import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import { SyntaxKind } from "ts-morph"
import * as Assert from "node:assert"

type KnownOperator = { kotlin: string | null; swift: string | null }
const MAPPED_TOKENS: Record<any, KnownOperator> = {
	[SyntaxKind.AsteriskToken]: { kotlin: null, swift: null },
	[SyntaxKind.PlusToken]: { kotlin: null, swift: null },
	[SyntaxKind.MinusToken]: { kotlin: null, swift: null },
	[SyntaxKind.AmpersandToken]: { kotlin: null, swift: null },
	[SyntaxKind.AsKeyword]: { kotlin: "as", swift: "as?" },
	[SyntaxKind.AmpersandAmpersandToken]: { kotlin: null, swift: null },
	[SyntaxKind.EqualsEqualsEqualsToken]: { kotlin: "==", swift: null },
	[SyntaxKind.ExclamationEqualsEqualsToken]: { kotlin: "!=", swift: null },
	[SyntaxKind.QuestionQuestionToken]: { kotlin: "?:", swift: null },
	[SyntaxKind.EqualsEqualsToken]: { kotlin: null, swift: null },
	[SyntaxKind.EqualsGreaterThanToken]: { kotlin: null, swift: null },
	[SyntaxKind.LessThanEqualsToken]: { kotlin: null, swift: null },
	[SyntaxKind.GreaterThanEqualsToken]: { kotlin: null, swift: null },
	[SyntaxKind.OpenParenToken]: { kotlin: null, swift: null },
	[SyntaxKind.CloseParenToken]: { kotlin: null, swift: null },
	[SyntaxKind.BarBarToken]: { kotlin: null, swift: null },
	[SyntaxKind.QuestionToken]: { kotlin: null, swift: null },
	[SyntaxKind.ThisKeyword]: { kotlin: "this", swift: null },
	[SyntaxKind.EqualsToken]: { kotlin: null, swift: null },
	[SyntaxKind.ExclamationEqualsToken]: { kotlin: null, swift: null },
	[SyntaxKind.GreaterThanToken]: { kotlin: null, swift: null },
	[SyntaxKind.LessThanToken]: { kotlin: null, swift: null },
	[SyntaxKind.ExclamationToken]: { kotlin: "!!", swift: null },
	[SyntaxKind.PlusEqualsToken]: { kotlin: null, swift: null },
	[SyntaxKind.ThrowKeyword]: { kotlin: "throw", swift: "throw" },
	[SyntaxKind.NullKeyword]: { kotlin: "null", swift: "nil" },
	[SyntaxKind.FalseKeyword]: { kotlin: "false", swift: "" },
	[SyntaxKind.TrueKeyword]: { kotlin: "", swift: "" },
	[SyntaxKind.InstanceOfKeyword]: { kotlin: "is", swift: "" },
	[SyntaxKind.ReturnKeyword]: { kotlin: "return ", swift: "" },
} as const

export class TReservedWord extends TConstruct {
	private readonly operator: KnownOperator
	constructor(symbolNode: TsNode, expectedWord: SyntaxKind | null) {
		super()
		const nodeKind = symbolNode.getKind()
		Assert.equal(TReservedWord.isReservedWord(nodeKind), true, "Non-operator node passed")
		if (expectedWord) Assert.equal(expectedWord, nodeKind, "Expectation mismatch for token")

		const nodeRawText = symbolNode.getText(false)
		const kotlin = MAPPED_TOKENS[nodeKind].kotlin ?? nodeRawText
		const swift = MAPPED_TOKENS[nodeKind].swift ?? nodeRawText
		this.operator = { kotlin, swift }
	}

	static isReservedWord(nodeKind: SyntaxKind): boolean {
		return MAPPED_TOKENS[nodeKind] != null
	}

	generateKotlin(): ConstructOut {
		return this.operator.kotlin
	}
}
