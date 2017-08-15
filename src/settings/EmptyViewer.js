// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import MessageBox from "../gui/base/MessageBox"

assertMainOrNode()

export class EmptyViewer {

	view: Function;

	constructor() {
		let message = new MessageBox(() => "This view is not yet available in this Tutanota beta client. Please be patient, it will come soon. :-)")
		this.view = (): VirtualElement => {
			return m(message)
		}
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {

	}
}