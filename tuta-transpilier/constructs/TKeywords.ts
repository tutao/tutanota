import { ConstructOut, TConstruct, TsNode } from "./TConstruct"
import { ts } from "ts-morph"
import SyntaxKind = ts.SyntaxKind

export class TReturnKeyword extends TConstruct {
	constructor(returnKeyWord: TsNode) {
		console.assert(returnKeyWord.getKind() === SyntaxKind.ReturnStatement, "expected only return keyword")
		super()
	}

	generateKotlin(): ConstructOut {
		return `return `
	}
}
