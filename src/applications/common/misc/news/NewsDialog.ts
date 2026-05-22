import { ButtonAttrs, ButtonType } from "../../../../ui/base/Button.js"
import m, { Component } from "mithril"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../../ui/base/DialogHeaderBar.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { Keys } from "@tutao/app-env"
import { NewsList } from "./NewsList.js"
import { NewsModel } from "./NewsModel.js"
import { progressIcon } from "../../../../ui/base/Icon.js"

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
		middle: "news_label",
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
								dialog,
							})
						: m(
								".flex-center.mt-32",
								m(".flex-v-center", [m(".full-width.flex-center", progressIcon()), m("p", lang.getTranslationText("pleaseWait_msg"))]),
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
