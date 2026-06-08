import { ConstructOut, TConstruct } from "./TConstruct"
import { TemplateExpression } from "ts-morph"

export class TTemplateExpr extends TConstruct {
	private readonly todo_destruct: string
	constructor(typedNode: TemplateExpression) {
		super()
		const todo_destruct = typedNode.getText()
		this.todo_destruct = todo_destruct.slice(1, -1)
	}

	generateKotlin(): ConstructOut {
		return `TsString("${this.todo_destruct}")`
	}
}
