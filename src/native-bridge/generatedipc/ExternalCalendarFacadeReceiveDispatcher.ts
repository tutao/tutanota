/* generated file, don't edit. */

import { ExternalCalendarFacade } from "./ExternalCalendarFacade.js"

export class ExternalCalendarFacadeReceiveDispatcher {
	constructor(private readonly facade: ExternalCalendarFacade) {}
	async dispatch(method: string, arg: Array<any>): Promise<any> {
		switch (method) {
			case "fetchExternalCalendar": {
				const url: string = arg[0]
				return this.facade.fetchExternalCalendar(url)
			}
		}
	}
}
