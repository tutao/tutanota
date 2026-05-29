/* generated file, don't edit. */

import { OauthFacade } from "@tutao/native-bridge/generatedIpc/types"

export class OauthFacadeReceiveDispatcher {
	constructor(private readonly facade: OauthFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "openOauthWindow": {
				const url: string = arg[0]
				const redirectUrl: string = arg[1]
				return this.facade.openOauthWindow(url, redirectUrl)
			}
		}
	}
}
