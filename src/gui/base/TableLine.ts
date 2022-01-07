import {Button} from "./Button"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()
export default class TableLine {
	cells: string[]
	actionButton: Button | null

	constructor(cells: string[], actionButton: Button | null) {
		this.cells = cells
		this.actionButton = actionButton
	}
}