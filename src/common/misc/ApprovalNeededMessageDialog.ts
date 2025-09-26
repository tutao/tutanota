import { Dialog, DialogType } from "../gui/base/Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar.js"
import { InfoLink, lang } from "./LanguageViewModel.js"
import { defer } from "@tutao/tutanota-utils"
import m from "mithril"
import { Button, ButtonAttrs, ButtonType } from "../gui/base/Button.js"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { Type } from "cborg"
import { Keys } from "../api/common/TutanotaConstants.js"

function renderMoreInfoLink(link: InfoLink) {
	return [
		m(".block", { style: { "text-align": "center" } }, lang.get("moreInfo_msg")),
		m(".block", { style: { "text-align": "center" } }, [
			m(ExternalLink, {
				href: link,
				isCompanySite: true,
			}),
		]),
	]
}

export async function showApprovalNeededMessageDialog(): Promise<void> {
	const headerAttrs: DialogHeaderBarAttrs = {
		middle: "notice_label",
	}
	const closeAction = () => {
		dialog.close()
		resolve()
	}
	const buttonAttrs: ButtonAttrs = {
		label: "ok_action",
		click: closeAction,
		type: ButtonType.Primary,
	}

	const { promise, resolve } = defer<void>()

	const dialog = new Dialog(DialogType.EditSmall, {
		view: () => [
			m(DialogHeaderBar, headerAttrs),
			m("div.mt-16.mb-16.mlr-12", [
				m(
					"p",
					{
						style: {
							"text-align": "center",
						},
					},
					lang.get("approvalWaitNotice_msg"),
				),
				renderMoreInfoLink(InfoLink.AccountApprovalFaq),
			]),
			m(".flex-center.dialog-buttons", m(Button, buttonAttrs)),
		],
	})
		.setCloseHandler(closeAction)
		.addShortcut({
			help: "close_alt",
			key: Keys.ESC,
			exec: closeAction,
		})
		.show()

	return promise
}
