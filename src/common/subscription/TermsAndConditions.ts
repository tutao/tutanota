/**
 * The most recently published version of the terms and conditions
 */
import m, { Children } from "mithril"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { isApp } from "../api/common/Env"
import { requestFromWebsite } from "../misc/Website"
import { Dialog } from "../gui/base/Dialog"
import { htmlSanitizer } from "../misc/HtmlSanitizer"
import { DialogHeaderBarAttrs } from "../gui/base/DialogHeaderBar"
import { ButtonType } from "../gui/base/Button.js"
import { locator } from "../api/main/CommonLocator.js"

/**
 * The most up-to-date versions of the terms and conditions, privacy statement, and gift card terms
 * must be in sync with the website
 */
export const CURRENT_TERMS_VERSION = "3.2" as const
export const CURRENT_PRIVACY_VERSION = "3.1" as const
export const CURRENT_GIFT_CARD_TERMS_VERSION = "1.0" as const

/**
 * Show a link to the terms and conditions page on the website.
 * In the mobile apps, it will instead open a dialog containing the text
 */
export function renderTermsAndConditionsButton(terms: TermsSection, version: string): Children {
	let label
	let link
	switch (terms) {
		case TermsSection.GiftCards:
			label = lang.get("giftCardTerms_label")
			link = InfoLink.GiftCardsTerms
			break
		case TermsSection.Terms:
			label = lang.get("termsAndConditionsLink_label")
			link = InfoLink.Terms
			break
		case TermsSection.Privacy:
			label = lang.get("privacyLink_label")
			link = InfoLink.Privacy
			break
	}
	return m(
		`a[href=${link}][target=_blank]`,
		{
			onclick: (e: MouseEvent) => {
				if (isApp()) {
					showServiceTerms(terms, version)
					e.preventDefault()
				}
			},
		},
		label,
	)
}

/**
 * An enum denoting a section of the tutanota terms to request.
 * The value of the enum is the path that is used in the request to the website
 */
export const enum TermsSection {
	Terms = "terms-entries",
	Privacy = "privacy-policy-entries",
	GiftCards = "giftCardsTerms-entries",
}

export async function showServiceTerms(section: TermsSection, version: string) {
	const path = `/${section}/${version}.json`
	const termsFromWebsite = await requestFromWebsite(path, locator.domainConfigProvider().getCurrentDomainConfig()).then((res) => res.json())
	let visibleLang: "en" | "de" = lang.code.startsWith("de") ? "de" : "en"
	let dialog: Dialog
	let sanitizedTerms: string

	function getSection(): string {
		return htmlSanitizer.sanitizeHTML(termsFromWebsite[visibleLang], {
			blockExternalContent: false,
		}).html
	}

	let headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: () => "EN/DE",
				click: () => {
					visibleLang = visibleLang === "de" ? "en" : "de"
					sanitizedTerms = getSection()
					m.redraw()
				},
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "ok_action",
				click: () => dialog.close(),
				type: ButtonType.Primary,
			},
		],
	}
	sanitizedTerms = getSection()
	dialog = Dialog.largeDialog(headerBarAttrs, {
		view: () => m(".text-break", m.trust(sanitizedTerms)),
	}).show()
}
