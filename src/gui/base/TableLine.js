// @flow
import {assertMainOrNode} from "../../api/Env"
import {Button} from "./Button"

assertMainOrNode()

export default class TableLine {
	cells: string[];
	actionButton: ?Button;

	constructor(cells: string[], actionButton: ?Button) {
		this.cells = cells;
		this.actionButton = actionButton;
	}
}
