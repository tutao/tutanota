/* generated file, don't edit. */

import { LocalImportMailState } from "./LocalImportMailState.js"
import { MailImportFacade } from "./MailImportFacade.js"

export class MailImportFacadeReceiveDispatcher {
	constructor(private readonly facade: MailImportFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "onNewLocalImportMailState": {
				const localImportMailState: LocalImportMailState = arg[0]
				return this.facade.onNewLocalImportMailState(localImportMailState)
			}
		}
	}
}
