import m, { Children } from "mithril"
import { Icons } from "../../gui/base/icons/Icons"
import type { CustomerInfo, GiftCard } from "../../api/entities/sys/TypeRefs.js"
import { CustomerInfoTypeRef, CustomerTypeRef, GiftCardTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { locator } from "../../api/main/CommonLocator"
import { lang, MaybeTranslation } from "../../misc/LanguageViewModel"
import { UserError } from "../../api/main/UserError"
import { Dialog } from "../../gui/base/Dialog"
import { ButtonType } from "../../gui/base/Button.js"
import { DefaultAnimationTime } from "../../gui/animation/Animations"
import { copyToClipboard } from "../../misc/ClipboardUtils"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { isAndroidApp, isApp } from "../../api/common/Env"
import { Checkbox } from "../../gui/base/Checkbox.js"
import { Keys } from "../../api/common/TutanotaConstants"
import { CURRENT_GIFT_CARD_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection } from "../TermsAndConditions"
import { IconButton } from "../../gui/base/IconButton.js"
import { formatPrice } from "../utils/PriceUtils.js"
import { getHtmlSanitizer } from "../../misc/HtmlSanitizer.js"
import { urlEncodeHtmlTags } from "../../misc/Formatter.js"
import QRCode from "qrcode-svg"

export const enum GiftCardStatus {
	Deactivated = "0",
	Usable = "1",
	Redeemed = "2",
	Refunded = "3",
	Disputed = "4",
}

export async function getTokenFromUrl(url: string): Promise<{ id: Id; key: string }> {
	const token = url.substring(url.indexOf("#") + 1)

	try {
		if (!token) {
			throw new Error()
		}

		return await locator.giftCardFacade.decodeGiftCardToken(token)
	} catch (e) {
		throw new UserError("invalidGiftCard_msg")
	}
}

export function loadGiftCards(customerId: Id): Promise<GiftCard[]> {
	const entityClient = locator.entityClient
	return entityClient
		.load(CustomerTypeRef, customerId)
		.then((customer) => entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
		.then((customerInfo: CustomerInfo) => {
			if (customerInfo.giftCards) {
				return entityClient.loadAll(GiftCardTypeRef, customerInfo.giftCards.items)
			} else {
				return Promise.resolve([])
			}
		})
}

export async function generateGiftCardLink(giftCard: GiftCard): Promise<string> {
	const token = await locator.giftCardFacade.encodeGiftCardToken(giftCard)
	const giftCardBaseUrl = locator.domainConfigProvider().getCurrentDomainConfig().giftCardBaseUrl
	const giftCardUrl = new URL(giftCardBaseUrl)
	giftCardUrl.hash = token
	return giftCardUrl.href
}

export function showGiftCardToShare(giftCard: GiftCard) {
	generateGiftCardLink(giftCard).then((link) => {
		let infoMessage: MaybeTranslation = "emptyString_msg"
		const dialog: Dialog = Dialog.largeDialog(
			{
				right: [
					{
						type: ButtonType.Secondary,
						label: "close_alt",
						click: () => dialog.close(),
					},
				],
				middle: "giftCard_label",
			},
			{
				view: () => [
					m(
						".flex-center.full-width.pt-16.pb-16",
						m(
							".pt-32", // Needed to center SVG
							{
								style: {
									width: "480px",
								},
							},
							renderGiftCardSvg(parseFloat(giftCard.value), link, giftCard.message),
						),
					),
					m(".flex-center", [
						m(IconButton, {
							click: () => {
								dialog.close()
								setTimeout(
									() => import("../../../mail-app/mail/editor/MailEditor").then((editor) => editor.writeGiftCardMail(link)),
									DefaultAnimationTime,
								)
							},
							title: "shareViaEmail_action",
							icon: BootIcons.Mail,
						}),
						isAndroidApp()
							? m(IconButton, {
									click: () => {
										locator.systemFacade.shareText(
											lang.get("nativeShareGiftCard_msg", {
												"{link}": link,
											}),
											lang.get("nativeShareGiftCard_label"),
										)
									},
									title: "share_action",
									icon: BootIcons.Share,
								})
							: m(IconButton, {
									click: () => {
										copyToClipboard(link)
											.then(() => {
												infoMessage = "giftCardCopied_msg"
											})
											.catch(() => {
												infoMessage = "copyLinkError_msg"
											})
									},
									title: "copyToClipboard_action",
									icon: Icons.Clipboard,
								}),
						!isApp()
							? m(IconButton, {
									click: () => {
										infoMessage = "emptyString_msg"
										window.print()
									},
									title: "print_action",
									icon: Icons.Print,
								})
							: null,
					]),
					m(".flex-center", m("small.noprint", lang.getTranslationText(infoMessage))),
				],
			},
		)
			.addShortcut({
				key: Keys.ESC,
				exec: () => dialog.close(),
				help: "close_alt",
			})
			.show()
	})
}

// Used to get gift-card.svg when `renderGiftCardSvg()` is called and cache it.
const giftCardSVGGetter = new (class GiftCardSVGGetter {
	private static giftCardSvg: string | null = null
	private static giftCardNoQrSvg: string | null = null

	// Returns a cached `gift-card.svg` or downloads it if online. Returns a placeholder if offline.
	getWithQr(): string {
		if (GiftCardSVGGetter.giftCardSvg == null) {
			GiftCardSVGGetter.downloadSVG("gift-card", (rawSVG) => {
				GiftCardSVGGetter.giftCardSvg = rawSVG
				m.redraw() // Rerender any calling views that use the SVG
			})
			return GiftCardSVGGetter.getPlaceHolder("<rect id='qr-code' width='80' height='80' x='0' y='70'></rect>")
		}
		return GiftCardSVGGetter.giftCardSvg
	}

	// Returns a cached `gift-card-no-qr.svg` or downloads it if online. Returns a placeholder if offline.
	getNoQr(): string {
		if (GiftCardSVGGetter.giftCardNoQrSvg == null) {
			GiftCardSVGGetter.downloadSVG("gift-card-no-qr", (rawSVG) => {
				GiftCardSVGGetter.giftCardNoQrSvg = rawSVG
				m.redraw()
			})
			return GiftCardSVGGetter.getPlaceHolder()
		}
		return GiftCardSVGGetter.giftCardNoQrSvg
	}

	// Downloads an SVG from the images folder without returning a promise via using a callback
	private static downloadSVG(fileName: string, onComplete: (rawSVG: string) => void) {
		fetch(`${window.tutao.appState.prefixWithoutFile}/images/${fileName}.svg`).then(
			async (res) => {
				onComplete(await res.text())
			},
			() => {},
		)
	}

	// Renders the placeholder gift card, optionally with extra HTML
	private static getPlaceHolder(extraElements: string = ""): string {
		return `
			<svg width='480' height='600'>
				<text id='card-label' x='0' y='20'></text>
				<text id='message' x='0' y='40' fill='#fff'></text>
				<text id='price' x='0' y='60'></text>
				${extraElements}
			</svg>`
	}
})()

export function renderGiftCardSvg(price: number, link: string | null, message: string): Children {
	const svg = link == null ? giftCardSVGGetter.getNoQr() : giftCardSVGGetter.getWithQr()
	const svgDocument: Document = new DOMParser().parseFromString(svg, "image/svg+xml")

	// Generate and replace the qrcode placeholder a QR Code to the link if provided
	if (link != null) {
		const qrCodeElement = getGiftCardElement(svgDocument, "qr-code")
		const qrCodeWidth = getNumberAttribute(qrCodeElement, "width")
		const qrCodeHeight = getNumberAttribute(qrCodeElement, "height")
		const qrCodeXPosition = getNumberAttribute(qrCodeElement, "x")
		const qrCodeYPosition = getNumberAttribute(qrCodeElement, "y")
		qrCodeElement.outerHTML = renderQRCode(qrCodeXPosition, qrCodeYPosition, qrCodeWidth, qrCodeHeight, link)
	}

	const labelElement = getGiftCardElement(svgDocument, "card-label")
	labelElement.textContent = lang.get("giftCard_label").toUpperCase()

	const priceElement = getGiftCardElement(svgDocument, "price")
	priceElement.textContent = formatPrice(price, false).replace(/\s+/g, "") + "€"
	// Append the € symbol manually because in one particular language the € sign is being translated into "EUR" using `formatPrice` method

	// SVG text elements do not have word wrap, so we use an HTML `p` element to avoid word wrapping via JS ourselves
	// It would be nice to have this decoupled from the current design of the gift card
	const messageElement = getGiftCardElement(svgDocument, "message")
	const messageColor = getAttribute(messageElement, "fill")
	messageElement.outerHTML = renderMessage(19, 61, 108, 70, messageColor, message)

	return m.trust(svgDocument.documentElement.outerHTML)
}

// Gets an attribute of an element that has a type of number
function getNumberAttribute(element: Element, attributeName: string): number {
	const raw = element.getAttribute(attributeName)
	if (raw == null) {
		throw new Error(`Error while rendering gift card: missing attribute ${attributeName} from ${element.id}`)
	}
	return Number(raw)
}

function getAttribute(element: Element, attributeName: string): string {
	const raw = element.getAttribute(attributeName)
	if (raw == null) {
		throw new Error(`Error while rendering gift card: missing attribute ${attributeName} from ${element.id}`)
	}
	return raw
}

// Gets one of the standard gift card elements from an SVG.
function getGiftCardElement(svgDocument: Document, id: "price" | "qr-code" | "message" | "card-label"): SVGElement {
	const element = svgDocument.getElementById(id) as SVGElement | null
	if (element == null) {
		throw new Error(`Error while rendering gift card: missing element ${id}`)
	}
	return element
}

/**
 * Renders a text with word wrapping in an SVG element. (0,0) is the top left.
 * @param x The position of the element on the X Axis.
 * @param y The position of the element on the Y Axis.
 * @param width The width of the text element.
 * @param height The height of the text element.
 * @param color The fill colour of the text element.
 * @param message The text to be displayed in the element.
 */
function renderMessage(x: number, y: number, width: number, height: number, color: string, message: string): string {
	const cleanMessage: string = getHtmlSanitizer().sanitizeHTML(urlEncodeHtmlTags(message)).html

	const lineBreaks = cleanMessage.split(/\r\n|\r|\n/).length
	const charLength = cleanMessage.length

	const fontSizePx = lineBreaks > 4 || charLength > 80 ? "6px" : "7px"

	return `
		<foreignObject x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}">
			<p xmlns="http://www.w3.org/1999/xhtml"
			   class="text-preline text-break color-adjust-exact monospace"
			   style="font-size: ${fontSizePx}; color: ${color}; margin: auto 0 0 0">
				${cleanMessage}
			</p>
		</foreignObject>`
}

/**
 * Generates a black-on-white QR Code in SVG form
 * @param x The position on the X Axis of the QR Code. 0 is the far left.
 * @param y The position on the Y Axis of the QR Code. 0 is the top.
 * @param link The link that the generated QR code will lead to when scanned
 * @param height The height in pixels of the resulting QR code
 * @param width The width in pixels of the resulting QR code
 * @return the SVG element of the generated QR code as a `string`
 */
function renderQRCode(x: number, y: number, width: number, height: number, link: string): string {
	const svgFragment = new QRCode({
		height,
		width,
		content: link,
		background: "#ffffff",
		color: "#000000",
		xmlDeclaration: false,
		container: "none",
		padding: 0,
		join: true,
		pretty: false,
	}).svg()

	return getHtmlSanitizer().sanitizeSVG(`<svg x="${x}" y="${y}" width="${width}" height="${height}">${svgFragment}</svg>`).html
}

export function renderAcceptGiftCardTermsCheckbox(checked: boolean, onChecked: (checked: boolean) => void, classes?: string): Children {
	return m(Checkbox, {
		checked,
		onChecked,
		class: classes,
		label: () => [lang.get("termsAndConditions_label"), m("div", renderTermsAndConditionsButton(TermsSection.GiftCards, CURRENT_GIFT_CARD_TERMS_VERSION))],
	})
}
