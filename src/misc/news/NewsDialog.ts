import {ButtonAttrs, ButtonType} from "../../gui/base/Button.js"
import m, {Component} from "mithril"
import {DialogHeaderBar, DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar.js"
import {lang} from "../LanguageViewModel.js"
import {Dialog, DialogType} from "../../gui/base/Dialog.js"
import {Keys} from "../../api/common/TutanotaConstants.js"
import {NewsList} from "./NewsList.js"
import {NewsModel} from "./NewsModel.js"

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
	const child: Component = {
		view: () => {
			return [
				m("", [
					m(NewsList, {
						liveNewsIds: newsModel.liveNewsIds,
						liveNewsListItems: newsModel.liveNewsListItems,
					})
				]),
			]
		}
	}

	const dialog = new Dialog(DialogType.EditLarge, {
		view: () => {
			return m("", [
				m(".dialog-header.plr-l", m(DialogHeaderBar, header)),
				m(".dialog-container.scroll", m(".fill-absolute", m(child))),
			])
		},
	}).addShortcut({
		key: Keys.ESC,
		exec: () => {
			closeAction()
		},
		help: "close_alt",
	})

	newsModel.loadNewsIds().then(() => dialog.show())
}
