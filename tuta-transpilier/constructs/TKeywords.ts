import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import { ts } from "ts-morph"
import { Assert } from "../Constants"
import SyntaxKind = ts.SyntaxKind

export class TReturnKeyword extends TConstruct {
	constructor(returnKeyWord: TsNode) {
		Assert.isTrue(returnKeyWord.getKind() === SyntaxKind.ReturnKeyword, "expected only return keyword")
		super()
	}

	generateKotlin(): ConstructOut {
		return `return `
	}
}
