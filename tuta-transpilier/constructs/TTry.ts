import { ConstructOut, TConstruct } from "./TConstruct"
import { TryStatement } from "ts-morph"
import { TBlock } from "./TBlock"
import { TIdentitider } from "./TIdentitider"

export class TTry extends TConstruct {
	private readonly tryBlock: TBlock
	private readonly catchBlock: TBlock
	private readonly catchedName: TIdentitider
	private readonly finallyBlock: TBlock | null = null

	constructor(tryStatement: TryStatement) {
		super()
		const tryBlock = tryStatement.getTryBlock()
		const finallyBlock = tryStatement.getFinallyBlock() ?? null
		const catchClause = tryStatement.getCatchClauseOrThrow("Try statement without catch?")
		const catchVar = catchClause.getVariableDeclarationOrThrow("Catch must always define a variable")
		const catchBlock = catchClause.getBlock()

		this.tryBlock = new TBlock(tryBlock)
		this.catchedName = new TIdentitider(catchVar.getName())
		this.catchBlock = new TBlock(catchBlock)
		if (finallyBlock != null) this.finallyBlock = new TBlock(finallyBlock)
	}

	generateKotlin(): ConstructOut {
		const tryBlock = this.tryBlock.generateKotlin()
		const catchVar = this.catchedName.generateKotlin()
		const catchBlock = this.catchBlock.generateKotlin()
		const finallyBlock = this.finallyBlock?.generateKotlin() ?? "{}"

		return `try ${tryBlock} catch (${catchVar}: Throwable) ${catchBlock} finally ${finallyBlock}`
	}
}
