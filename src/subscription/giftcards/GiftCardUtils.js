// @flow

import m from "mithril"
import QRCode from "qrcode"
import {Icons} from "../../gui/base/icons/Icons"
import type {CustomerInfo} from "../../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../../api/entities/sys/CustomerInfo"
import {CustomerTypeRef} from "../../api/entities/sys/Customer"
import {locator} from "../../api/main/MainLocator"
import type {GiftCard} from "../../api/entities/sys/GiftCard"
import {_TypeModel as GiftCardTypeModel, GiftCardTypeRef} from "../../api/entities/sys/GiftCard"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {UserError} from "../../api/main/UserError"
import {showServiceTerms} from "../SubscriptionUtils"
import {Dialog} from "../../gui/base/Dialog"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {serviceRequest} from "../../api/main/Entity"
import {SysService} from "../../api/entities/sys/Services"
import {px} from "../../gui/size"
import type {lazy} from "@tutao/tutanota-utils"
import {assertNotNull, neverNull} from "@tutao/tutanota-utils"
import {LocationServiceGetReturnTypeRef} from "../../api/entities/sys/LocationServiceGetReturn"
import type {Country} from "../../api/common/CountryList"
import {getByAbbreviation} from "../../api/common/CountryList"
import {NotAuthorizedError, NotFoundError} from "../../api/common/error/RestError"
import {CancelledError} from "../../api/common/error/CancelledError"
import {theme} from "../../gui/theme"
import {DefaultAnimationTime} from "../../gui/animation/Animations"
import {copyToClipboard} from "../../misc/ClipboardUtils"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {base64ExtToBase64, base64ToBase64Ext, base64ToBase64Url, base64UrlToBase64} from "@tutao/tutanota-utils"
import {getWebRoot, isAndroidApp, isApp} from "../../api/common/Env"
import {CheckboxN} from "../../gui/base/CheckboxN"
import {ParserError} from "../../misc/parsing/ParserCombinator"
import {Keys} from "../../api/common/TutanotaConstants"
import {elementIdPart, GENERATED_MAX_ID} from "../../api/common/utils/EntityUtils"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {formatPrice} from "../PriceUtils"
import {ofClass} from "@tutao/tutanota-utils"
import type {Base64} from "@tutao/tutanota-utils/"

const ID_LENGTH = GENERATED_MAX_ID.length
const KEY_LENGTH = 24

export function getTokenFromUrl(url: string): [Id, string] {
	let id: Id, key: string;
	const token = url.substr(url.indexOf("#") + 1)
	try {
		if (!token) {
			throw new Error()
		}
		[id, key] = _decodeToken(token)

	} catch (e) {
		throw new UserError("invalidGiftCard_msg")
	}
	return [id, key]
}

export function redeemGiftCard(giftCardId: IdTuple, key: string, validCountryCode: string, getConfirmation: (TranslationKey | lazy<string>) => Promise<boolean>): Promise<void> {
	// Check that the country matches
	return serviceRequest(SysService.LocationService, HttpMethod.GET, null, LocationServiceGetReturnTypeRef)
		.then(userLocation => {
			const validCountry = getByAbbreviation(validCountryCode)
			if (!validCountry) {
				throw new UserError("invalidGiftCard_msg")
			}
			const validCountryName = validCountry.n

			const userCountry = getByAbbreviation(userLocation.country)
			const userCountryName = assertNotNull(userCountry).n

			return userCountryName === validCountryName
				|| getConfirmation(() => lang.get("validGiftCardCountry_msg", {
					"{valid}": validCountryName,
					"{actual}": userCountryName
				}))
		})
		.then(confirmed => {
			if (!confirmed) throw new CancelledError("")
		})
		.then(() => {
			return locator.giftCardFacade.redeemGiftCard(elementIdPart(giftCardId), key)
			             .catch(ofClass(NotFoundError, () => { throw new UserError("invalidGiftCard_msg") }))
			             .catch(ofClass(NotAuthorizedError, e => { throw new UserError(() => e.message) }))
		})
}

export function loadGiftCards(customerId: Id): Promise<GiftCard[]> {
	const entityClient = locator.entityClient

	return entityClient.load(CustomerTypeRef, customerId)
	                   .then(customer => entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
	                   .then((customerInfo: CustomerInfo) => {
		                   if (customerInfo.giftCards) {
			                   return entityClient.loadAll(GiftCardTypeRef, customerInfo.giftCards.items)
		                   } else {
			                   return Promise.resolve([])
		                   }
	                   })
}

export function generateGiftCardLink(giftCard: GiftCard): Promise<string> {
	return locator.worker.resolveSessionKey(GiftCardTypeModel, giftCard).then(key => {
		// This should not assert false and if it does we want to know about it
		key = assertNotNull(key)
		return getWebRoot() + `/giftcard/#${_encodeToken(elementIdPart(giftCard._id), key)}`
	})
}

export function _encodeToken(id: Id, key: string): Base64 {
	if (id.length !== ID_LENGTH || key.length !== KEY_LENGTH) {
		throw new Error("invalid input")
	}

	const idPart = base64ToBase64Url(base64ExtToBase64(id))
	console.log("encoded id length", idPart.length)
	const keyPart = base64ToBase64Url(key)
	return idPart + keyPart
}

export function _decodeToken(token: Base64): [Id, string] {
	const id = base64ToBase64Ext(base64UrlToBase64(token.slice(0, ID_LENGTH)))
	const key = base64UrlToBase64(token.slice(ID_LENGTH, token.length))
	if (id.length !== ID_LENGTH || key.length !== KEY_LENGTH) {
		throw new ParserError("invalid token")
	}
	return [id, key]
}

export function showGiftCardToShare(giftCard: GiftCard) {
	generateGiftCardLink(giftCard)
		.then(link => {
			let dialog: Dialog
			let infoMessage = "emptyString_msg"
			let message = giftCard.message
			let giftCardDomElement: HTMLElement

			dialog = Dialog.largeDialog(
				{
					right: [
						{
							type: ButtonType.Secondary,
							label: "close_alt",
							click: () => dialog.close()
						}
					],
					middle: () => lang.get("giftCard_label")
				},
				{
					view: () =>
						m("",
							[
								m(".flex-center.full-width.pt.pb", [
										m("", {style: {width: "480px"}},
											m(".pt-l", {
												oncreate: (vnode) => {
													giftCardDomElement = vnode.children[0].dom
												}
											}, renderGiftCardSvg(parseFloat(giftCard.value), neverNull(getByAbbreviation(giftCard.country)), link, message))
										)
									]
								),
								m(".flex-center",
									[
										m(ButtonN, {
											click: () => {
												dialog.close()
												setTimeout(
													() => import("../../mail/editor/MailEditor")
														.then((editor) => editor.writeGiftCardMail(link, giftCardDomElement)),
													DefaultAnimationTime
												)
											},
											label: "shareViaEmail_action",
											icon: () => BootIcons.Mail
										}),
										isAndroidApp()
											? m(ButtonN, {
												click: () => {
													import("../../native/main/SystemApp").then((nativeApp) => {
														nativeApp.shareTextNative(lang.get("nativeShareGiftCard_msg", {"{link}": link}),
															lang.get("nativeShareGiftCard_label"))
													})
												},
												label: "share_action",
												icon: () => BootIcons.Share
											})
											: m(ButtonN, {
												click: () => {
													copyToClipboard(link)
														.then(() => {infoMessage = "giftCardCopied_msg"})
														.catch(() => {infoMessage = "copyLinkError_msg"})
												},
												label: "copyToClipboard_action",
												icon: () => Icons.Clipboard
											}),
										!isApp()
											? m(ButtonN, {
												click: () => {
													infoMessage = "emptyString_msg"
													window.print()
												},
												label: "print_action",
												icon: () => Icons.Print
											})
											: null
									]
								),
								m(".flex-center", m("small.noprint", lang.getMaybeLazy(infoMessage)))
							]
						)
				}).addShortcut({
				key: Keys.ESC,
				exec: () => dialog.close(),
				help: "close_alt"
			}).show()
		})
}

export function renderGiftCardSvg(price: number, country: Country, link: ?string, message: string): Children {
	let qrCode = null
	const qrCodeSize = 80
	if (link) {
		let qrcodeGenerator = new QRCode({
			height: qrCodeSize,
			width: qrCodeSize,
			content: link,
			background: theme.content_accent,
			color: theme.content_bg
		})
		qrCode = htmlSanitizer.sanitize(qrcodeGenerator.svg({container: null}), {blockExternalContent: false}).text
	}

	const formattedPrice = formatPrice(price, true)
	const baseHeight = 220
	const height = link ? baseHeight + qrCodeSize : baseHeight + 5 // a bit of padding if there's no qrcode
	const width = 240

	const borderRadius = 20

	// Do not change this value. Needs to remain consistent with the SVG path data
	const logoPathWidth = 153

	const logoWidth = 180
	const topBottomPadding = 20
	const logoScale = logoWidth / logoPathWidth

	const messageBoxTop = 80
	const messageBoxHeight = 75
	const qrCodeTopPadding = 10
	const qrCodeTop = messageBoxTop + messageBoxHeight + qrCodeTopPadding

	const giftCardLabelTopOffset = 45

	const centered = (elementWidth, totalWidth = width) => totalWidth / 2 - elementWidth / 2

	const squiggleStart = 117
	const qrCodePadding = 5
	const qrCodeLeft = 32

	const priceY = 35
	return m("svg", {
			style: {
				color: theme.elevated_bg,
				maxWidth: "960px",
				minwidth: "480px",
				"border-radius": px(borderRadius),
				filter: "drop-shadow(10px 10px 10px #00000088)"
			},
			xmlns: "http://www.w3.org/2000/svg",
			viewBox: `0 0 ${width} ${height}`
		},
		[
			m("rect", {
				width: "100%", height: "100%",
				style: {
					fill: theme.content_accent,
					"-webkit-print-color-adjust": "exact",
					"color-adjust": "exact",
				},
			}),
			m("g", {transform: `translate(${centered(logoWidth)}, ${topBottomPadding}) scale(${logoScale})`},
				[
					m("path", { /* tutanota logo text */
						fill: theme.elevated_bg,
						d: "M9.332 1.767H0V0h20.585v1.767h-9.333V28.42h-1.92zM20.086 22.89V8.257h1.843v14.402c0 3.073 1.344 4.57 4.417 4.57 2.803 0 5.146-1.459 7.642-3.84V8.257h1.844V28.42h-1.846v-3.341c-2.227 2.112-4.839 3.764-7.796 3.764-4.186 0-6.106-2.305-6.106-5.953zm23.85 1.037V9.908h-3.534V8.257h3.533V.922h1.844v7.335h5.261v1.652h-5.261v13.748c0 2.151.73 3.38 3.264 3.38.768 0 1.536-.077 2.112-.268v1.728c-.652.115-1.42.192-2.265.192-3.342 0-4.955-1.344-4.955-4.762zm11.136-.154c0-3.84 3.264-6.721 13.865-8.488v-1.229c0-3.072-1.614-4.608-4.379-4.608-3.341 0-5.569 1.305-7.835 3.341l-1.075-1.152c2.497-2.304 5.07-3.802 8.948-3.802 4.187 0 6.184 2.38 6.184 6.106v9.486c0 2.458.154 3.956.576 4.993h-1.96a9.82 9.82 0 01-.46-2.996c-2.459 2.113-5.147 3.342-8.181 3.342-3.687 0-5.684-1.92-5.684-4.993zm13.864-.154v-6.951c-9.831 1.728-12.02 4.147-12.02 6.99 0 2.265 1.497 3.494 3.993 3.494 2.996 0 5.723-1.305 8.027-3.533zm8.143 4.801V8.142h3.34v3.033c1.768-1.728 4.302-3.456 7.605-3.456 3.88 0 5.991 2.227 5.991 6.068v14.632h-3.302V14.517c0-2.688-1.152-3.955-3.726-3.955-2.419 0-4.455 1.267-6.567 3.264V28.42zm21.775-10.14c0-6.989 4.455-10.56 9.448-10.56 4.954 0 9.41 3.571 9.41 10.56 0 6.952-4.456 10.562-9.41 10.562-4.955 0-9.448-3.61-9.448-10.561zm15.516 0c0-4.224-2.036-7.719-6.068-7.719-3.88 0-6.107 3.15-6.107 7.72 0 4.301 1.997 7.758 6.107 7.758 3.84 0 6.068-3.111 6.068-7.758zm9.83 5.224V10.869h-3.532V8.142h3.533V.922h3.303v7.22h5.261v2.727h-5.262v11.906c0 2.15.692 3.226 3.15 3.226.73 0 1.536-.116 2.074-.27v2.728c-.577.115-1.844.23-2.88.23-4.264 0-5.646-1.651-5.646-5.185zm12.137.115c0-4.11 3.495-7.028 13.557-8.45v-.92c0-2.536-1.344-3.764-3.84-3.764-3.073 0-5.339 1.344-7.336 3.072l-1.728-2.074c2.342-2.15 5.377-3.764 9.41-3.764 4.838 0 6.758 2.535 6.758 6.76v8.948c0 2.458.154 3.956.577 4.993h-3.38c-.269-.845-.46-1.652-.46-2.804-2.267 2.113-4.801 3.111-7.836 3.111-3.495 0-5.722-1.843-5.722-5.108zm13.557-.46v-5.684c-7.72 1.229-10.293 3.11-10.293 5.645 0 1.959 1.306 2.996 3.418 2.996 2.689 0 4.993-1.114 6.875-2.958z"
					}),
					m("text", { /* translation of "gift card" */
						"text-anchor": "end",
						x: logoPathWidth, y: giftCardLabelTopOffset,
						fill: theme.elevated_bg
					}, lang.get("giftCard_label")),
				]),
			m("foreignObject", {
					x: centered(logoPathWidth),
					y: messageBoxTop,
					width: logoPathWidth,
					height: messageBoxHeight,
				},
				m("p.text-preline.text-break.color-adjust-exact.monospace.text-center", {
					'xmlns': 'http://www.w3.org/1999/xhtml',
					style: {
						margin: 0,
						fontSize: ".6rem",
						color: theme.elevated_bg,
						"font-family": "monospace",
					}
				}, message)),
			m("text", { /* price */
				"text-anchor": "start",
				x: qrCodeLeft,
				y: height - priceY,
				fill: theme.elevated_bg,
				"font-size": "1.6rem"
			}, formattedPrice),
			m("text", { /* valid in */
				"text-anchor": "start",
				x: qrCodeLeft,
				y: height - topBottomPadding - 5,
				fill: theme.elevated_bg,
				"font-size": ".4rem"
			}, lang.get("validInCountry_msg", {"{country}": country.n})),
			qrCode
				? m("g", {
					transform: `translate(${qrCodeLeft - qrCodePadding} ${qrCodeTop})`
				}, m.trust(qrCode))
				: null,
			m("path", {
				fill: theme.elevated_bg,
				transform: `translate(${squiggleStart} ${height - 80})`,
				d: "M74.483 0s8.728 1.406 8.713 4.992c0 .12-.011.237-.029.357-.612 3.86-13.283 3.762-18.682 4.23-5.394.459-20.04.149-23.739 6.625a1.996 1.996 0 00-.28.97c-.043 5.903 30.74 9.897 32.5 22.778.06.422.088.844.088 1.262-.025 13.047-27.86 24.602-61.907 38.193C7.43 80.891 3.78 82.585 0 83.896h127.618v-28.16c-3.2-8.982-9.027-17.293-19.193-22.564C87.613 22.37 55.084 20.366 53.693 16.204c-.06-.177-.09-.35-.085-.516.03-2.846 8.905-3.51 14.734-3.802 6.162-.302 15.481-1.135 16.622-5.56.056-.213.08-.422.08-.624C85.075 1.582 74.484 0 74.484 0z"
			})
		]
	)
}

export function renderAcceptGiftCardTermsCheckbox(confirmed: Stream<boolean>): Children {
	return m(CheckboxN, {
		checked: confirmed,
		label: () => [
			m("", lang.get("termsAndConditions_label")),
			m("div", m(`a[href=${lang.getInfoLink("giftCardsTerms_link")}][target=_blank]`, {
				onclick: e => {
					if (isApp()) {
						showServiceTerms("giftCards")
						e.preventDefault()
					}
				}
			}, lang.get("giftCardTerms_label")))
		],
	})
}