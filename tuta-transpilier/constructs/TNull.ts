import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import * as Assert from "node:assert"
import { ts } from "@ts-morph/common"
import { NullLiteral } from "ts-morph"
import SyntaxKind = ts.SyntaxKind

export class TNull extends TConstruct {
	constructor(nullWord: TsNode) {
		super()
		Assert.equal(TNull.isNull(nullWord), true, "Not a null word")
	}

	public static isNull(node: TsNode) {
		return node.getKind() === SyntaxKind.NullKeyword || node instanceof NullLiteral
	}

	generateKotlin(): ConstructOut {
		return "null"
	}
}
