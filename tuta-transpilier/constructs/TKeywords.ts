import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import { ts } from "ts-morph"
import * as Assert from "node:assert"
import SyntaxKind = ts.SyntaxKind

export class TReturnKeyword extends TConstruct {
	constructor(returnKeyWord: TsNode) {
		Assert.equal(returnKeyWord.getKind(), SyntaxKind.ReturnKeyword, "expected only return keyword")
		super()
	}

	generateKotlin(): ConstructOut {
		return `return `
	}
}
