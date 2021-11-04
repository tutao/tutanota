// @flow
import {Button} from "./Button"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export default class TableLine {
	cells: string[];
	actionButton: ?Button;

	constructor(cells: string[], actionButton: ?Button) {
		this.cells = cells;
		this.actionButton = actionButton;
	}
}
