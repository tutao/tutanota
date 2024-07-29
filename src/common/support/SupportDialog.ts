import { Dialog } from "../gui/base/Dialog"
import type { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import type { ButtonAttrs } from "../gui/base/Button.js"
import { ButtonType } from "../gui/base/Button.js"
import { lang } from "../misc/LanguageViewModel"
import { TextField } from "../gui/base/TextField.js"
import m, { Component } from "mithril"
import stream from "mithril/stream"
import { faq, FaqEntry } from "./FaqModel"
import { Keys } from "../api/common/TutanotaConstants"
import { clear, debounce } from "@tutao/tutanota-utils"
import { writeSupportMail } from "../../mail-app/mail/editor/MailEditor"
import { assertMainOrNode } from "../api/common/Env"
import { LoginController } from "../api/main/LoginController.js"
import { locator } from "../api/main/CommonLocator.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"

assertMainOrNode()

export async function showSupportDialog(logins: LoginController) {
	const canHaveEmailSupport = logins.isInternalUserLoggedIn()
	const searchValue = stream("")
	const searchResult: Array<FaqEntry> = []
	let searchExecuted = false
	const closeButton: ButtonAttrs = {
		label: "close_alt",
		type: ButtonType.Secondary,
		click: () => {
			closeAction()
		},
	}

	const closeAction = () => {
		searchValue("")
		clear(searchResult)
		dialog.close()
	}

	const debouncedSearch = debounce(200, async (value: string) => {
		clear(searchResult)
		for await (const result of faq.search(value)) {
			// if the search query changed, we don't want to continue
			// sanitizing entries, we'll get called again in 200ms
			if (searchValue() != value) break
			searchResult.push(result)
			// delay first redraw until the bottom of the result list is likely to be below the
			// visible area to prevent flashes while the list is built up
			if (searchResult.length > 3) m.redraw()
		}
		m.redraw()
		searchExecuted = value.trim() !== ""
	})

	searchValue.map(debouncedSearch)

	const header: DialogHeaderBarAttrs = {
		left: [closeButton],
		middle: () => lang.get("supportMenu_label"),
	}
	const child: Component = {
		view: () => {
			return [
				m(".pt"),
				m(".h1 .text-center", lang.get("howCanWeHelp_title")),
				m(TextField, {
					label: () => lang.get("describeProblem_msg"),
					value: searchValue(),
					oninput: searchValue,
				}),
				m(
					".pt",
					searchResult.map((value) => {
						return m(".pb.faq-items", [
							// we can trust the faq entry here because it is sanitized in update-translations.js from the website project
							// trust is required because the search results are marked with <mark> tag and the faq entries contain html elements.
							m(".b", m.trust(value.title)),
							m(
								".flex-start.flex-wrap",
								value.tags.filter((tag) => tag !== "").map((tag) => m(".keyword-bubble.plr-button", m.trust(tag.trim()))),
							),
							m(".list-border-bottom.pb", m.trust(value.text)),
						])
					}),
				),
				searchExecuted && canHaveEmailSupport
					? m(".pb", [
							m(".h1 .text-center", lang.get("noSolution_msg")),
							m(
								".flex.center-horizontally.pt",
								m(
									".flex-grow-shrink-auto.max-width-200",
									m(LoginButton, {
										label: "contactSupport_action",
										onclick: () => {
											writeSupportMail(searchValue().trim()).then((isSuccessful) => {
												if (isSuccessful) closeAction()
											})
										},
									}),
								),
							),
					  ])
					: null,
			]
		},
	}
	await faq.init(locator.domainConfigProvider().getCurrentDomainConfig().websiteBaseUrl)
	const dialog = Dialog.largeDialog(header, child).addShortcut({
		key: Keys.ESC,
		exec: () => {
			closeAction()
		},
		help: "close_alt",
	})
	dialog.show()
}
