//@flow


import {Dialog} from "../gui/base/Dialog"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {lang} from "../misc/LanguageViewModel"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {assertMainOrNode} from "../api/Env"
import {faq} from "./FaqModel"
import {Keys} from "../api/common/TutanotaConstants"
import {debounce} from "../api/common/utils/Utils"
import {writeSupportMail} from "../mail/MailEditorN"

assertMainOrNode()

export function showSupportDialog() {

	const searchValue = stream("")
	const searchResult = stream([])
	var searchExecuted = false

	const closeButton: ButtonAttrs = {
		label: "close_alt",
		type: ButtonType.Secondary,
		click: () => {
			closeAction()
		}
	}
	const closeAction = () => {
		searchValue("")
		searchResult([])
		dialog.close()
	}

	const debounceSearch = debounce(200, (value: string) => {
		searchResult(faq.search(value))
		searchExecuted = value.trim() !== ""
		m.redraw()
	})

	searchValue.map(newValue => {
		debounceSearch(newValue)
	})

	const contactSupport: ButtonAttrs = {
		label: "contactSupport_action",
		type: ButtonType.Login,
		click: () => {
			writeSupportMail(searchValue().trim())
			closeAction()
		}
	}


	const header: DialogHeaderBarAttrs = {
		left: [closeButton],
		middle: () => lang.get("supportMenu_label")
	}


	const searchInputField: TextFieldAttrs = {
		label: () => lang.get("describeProblem_msg"),
		value: searchValue
	}

	const child: Component = {
		view: () => {
			return [
				m(".pt"),
				m(".h1 .text-center", lang.get("howCanWeHelp_title")),
				m(TextFieldN, searchInputField),
				m(".pt", searchResult().map((value) => {
					return m(".pb.faq-items", [
						// we can trust the faq entry here because it is sanitized in update-translations.js from the website project
						// trust is required because the search results are marked with <mark> tag and the faq entries contain html elements.
						m(".b", m.trust(value.title)),
						m(".flex-start.ml-negative-bubble.flex-wrap", value.tags.split(",").filter((tag => tag
							!== "")).map(tag => m(".bubbleTag.plr-button", m.trust(tag.trim())))),
						m(".list-header.pb", m.trust(value.text))
					])
				})),
				searchExecuted
					? m(".pb", [
						m(".h1 .text-center", lang.get("noSolution_msg")),
						m(".flex.center-horizontally.pt", m(".flex-grow-shrink-auto.max-width-200", m(ButtonN, contactSupport))),
					])
					: null
			]
		}
	}

	faq.init().then(() => {
		faq.getList()
	})

	const dialog = Dialog.largeDialog(
		header,
		child
	).addShortcut({
		key: Keys.ESC,
		exec: () => {
			closeAction()
		},
		help: "close_alt"
	})
	dialog.show()
}