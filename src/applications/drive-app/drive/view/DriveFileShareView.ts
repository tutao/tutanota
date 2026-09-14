import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import m, { Children, Component, Vnode } from "mithril"
import { TopLevelAttrs } from "../../../../ui/base/TopLevelView"
import { locator } from "../../../common/api/main/CommonLocator"

export interface DriveFileShareViewAttrs extends TopLevelAttrs {}

export class DriveFileShareView extends BaseTopLevelView implements Component<DriveFileShareViewAttrs> {
	view(vnode: Vnode<DriveFileShareViewAttrs>): Children {
		const { listId, elementId, nonce } = m.route.param()
		const base64Key = location.hash.slice(1)

		return m("", `Hello ${listId}/${elementId} ${nonce}  ${base64Key}`)
	}

	protected async onNewUrl(args: Record<string, any>, requestedPath: string) {
		const { listId, elementId, nonce } = m.route.param()
		const base64Key = location.hash.slice(1)
		const file = await locator.driveFacade.downloadFileForShare([listId, elementId], nonce, base64Key)
		console.log(file)
	}
}
