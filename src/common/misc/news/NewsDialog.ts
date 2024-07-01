import { ButtonAttrs, ButtonType } from "../../gui/base/Button.js"
import m, { Component } from "mithril"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar.js"
import { lang } from "../LanguageViewModel.js"
import { Dialog, DialogType } from "../../gui/base/Dialog.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { NewsList } from "./NewsList.js"
import { NewsModel } from "./NewsModel.js"
import { progressIcon } from "../../gui/base/Icon.js"

export function showNewsDialog(newsModel: NewsModel) {
	const closeButton: ButtonAttrs = {
		label: "close_alt",
		type: ButtonType.Secondary,
		click: () => {
			closeAction()
		},
	}

	const closeAction = () => {
		dialog.close()
	}
	const header: DialogHeaderBarAttrs = {
		left: [closeButton],
		middle: () => lang.get("news_label"),
	}

	let loaded = false
	newsModel.loadNewsIds().then(() => {
		loaded = true
		m.redraw()
	})

	const child: Component = {
		view: () => {
			return [
				m("", [
					loaded
						? m(NewsList, {
								liveNewsIds: newsModel.liveNewsIds,
								liveNewsListItems: newsModel.liveNewsListItems,
						  })
						: m(
								".flex-center.mt-l",
								m(".flex-v-center", [m(".full-width.flex-center", progressIcon()), m("p", lang.getMaybeLazy("pleaseWait_msg"))]),
						  ),
				]),
			]
		},
	}

	const dialog = new Dialog(DialogType.EditLarge, {
		view: () => {
			return m("", [m(DialogHeaderBar, header), m(".dialog-container.scroll", m(".fill-absolute", m(child)))])
		},
	}).addShortcut({
		key: Keys.ESC,
		exec: () => {
			closeAction()
		},
		help: "close_alt",
	})
	dialog.show()
}
