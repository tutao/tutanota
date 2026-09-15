import { BaseTopLevelView } from "../../../../ui/BaseTopLevelView"
import m, { Children, Component, Vnode } from "mithril"
import { TopLevelAttrs } from "../../../../ui/base/TopLevelView"
import { locator } from "../../../common/api/main/CommonLocator"
import { DriveFile } from "@tutao/entities/drive"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Icon, IconSize, progressIcon } from "../../../../ui/base/Icon"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"

export interface DriveFileShareViewAttrs extends TopLevelAttrs {}

export class DriveFileShareView extends BaseTopLevelView implements Component<DriveFileShareViewAttrs> {
	private file: DriveFile | null = null
	view(vnode: Vnode<DriveFileShareViewAttrs>): Children {
		if (this.file) {
			return m(".flex.mlr-64.mt-64.mb-64.fill-absolute", [
				m(".flex.col.flex-space-between", [
					m(".logo-height", m.trust(theme.logo)),
					m(".flex.col.gap-8", [
						m(
							".flex.items-center",
							m(Icon, {
								icon: Icons.EmptyDocumentFilled,
								title: "emptyString_msg",
								size: IconSize.PX40,
								container: "div",
							}),
							m(".b.h2", this.file.name),
						),
						m(PrimaryButton, {
							label: "download_action",
							onclick: () => {}, //FIXME,
						}),
					]),
					m(""),
				]),
				m(".flex.col", ""),
			])
		} else {
			return progressIcon()
		}
	}

	protected async onNewUrl(args: Record<string, any>, requestedPath: string) {
		const { listId, elementId, nonce } = m.route.param()
		const base64Key = location.hash.slice(1)
		this.file = await locator.driveFacade.downloadFileForShare([listId, elementId], nonce, base64Key)
		m.redraw()
	}
}
