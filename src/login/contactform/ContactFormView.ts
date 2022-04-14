import m, {Children} from "mithril"
import {animations, opacity} from "../../gui/animation/Animations"
import {NotFoundError} from "../../api/common/error/RestError"
import {downcast, neverNull, ofClass} from "@tutao/tutanota-utils"
import {ContactFormRequestDialog} from "./ContactFormRequestDialog"
import {Dialog} from "../../gui/base/Dialog"
import {getLanguage, lang} from "../../misc/LanguageViewModel"
import {progressIcon} from "../../gui/base/Icon"
import {InfoView} from "../../gui/base/InfoView"
import {getDefaultContactFormLanguage} from "../../settings/contactform/ContactFormUtils"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {renderPrivacyAndImprintLinks} from "../LoginView"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {CurrentView, header} from "../../gui/base/Header"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Keys} from "../../api/common/TutanotaConstants"
import type {ContactForm} from "../../api/entities/tutanota/TypeRefs.js"
import {locator} from "../../api/main/MainLocator"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

class ContactFormView implements CurrentView {
	view: CurrentView["view"]
	private _contactForm: ContactForm | null
	private _moreInformationDialog: Dialog
	private _formId: string | null = null
	private _loading: boolean | null = null
	private _helpHtml: string | null
	private _headerHtml: string | null
	private _footerHtml: string | null

	constructor() {
		this._contactForm = null
		this._helpHtml = null
		this._headerHtml = null
		this._footerHtml = null

		let closeAction = () => this._moreInformationDialog.close()

		const moreInfoHeaderBarAttrs: DialogHeaderBarAttrs = {
			right: [
				{
					label: "ok_action",
					click: closeAction,
					type: ButtonType.Secondary,
				},
			],
			middle: () => lang.get("moreInformation_action"),
		}
		this._moreInformationDialog = Dialog
			.largeDialog(moreInfoHeaderBarAttrs, {
				view: () => {
					return m(".pb", m.trust(neverNull(this._helpHtml))) // is sanitized in updateUrl
				},
			})
			.addShortcut({
				key: Keys.ESC,
				exec: closeAction,
				help: "close_alt",
			})
			.setCloseHandler(closeAction)

		this.view = (): Children => {
			return m(".main-view.flex.col", [
				m(header),
				m(".flex-center.scroll", m(".flex-grow-shrink-auto.max-width-l.third.pb.plr-l", this._getContactFormContent())),
			])
		}
	}

	_getContactFormContent(): Children {
		if (this._loading) {
			return m(
				".flex-center.items-center.pt-l",
				{
					onbeforeremove: vnode => animations.add(
						vnode.dom as HTMLElement,
						opacity(1, 0, false)
					),
				},
				progressIcon(),
			)
		} else if (this._contactForm) {
			let language = getDefaultContactFormLanguage(this._contactForm.languages)
			return m(
				".mt",
				{
					oncreate: vnode => animations.add(
						vnode.dom as HTMLElement,
						opacity(0, 1, false)
					),
				},
				[
					language.pageTitle ? m("h1.center.pt", language.pageTitle) : null,
					m("", m.trust(neverNull(this._headerHtml))), // is sanitized in updateUrl
					m(".flex.justify-center", [
						m(".max-width-m.flex-grow-shrink-auto", [
							m(
								".pt-l",
								m(ButtonN, {
									label: "createContactRequest_action",
									click: () => new ContactFormRequestDialog(neverNull(this._contactForm)).show(),
									type: ButtonType.Login,
								}),
							),
							m(
								".pt-l",
								m(ButtonN, {
									label: "readResponse_action",
									click: () => m.route.set("/login"),
									type: ButtonType.Login,
								}),
							),
							this._helpHtml
								? m(
									".pt-l.flex-center",
									m(ButtonN, {
										label: "moreInformation_action",
										click: () => this._moreInformationDialog.show(),
										type: ButtonType.Secondary,
									}),
								)
								: null,
						]),
					]),
					m(".pt-l", m.trust(neverNull(this._footerHtml))), // is sanitized in updateUrl
					renderPrivacyAndImprintLinks(),
				],
			)
		} else {
			return m(
				new InfoView(
					() => "404",
					() => [m("p", lang.get("notFound404_msg")), m(".pb")],
				),
			)
		}
	}

	updateUrl(args: Record<string, any>) {
		if (this._formId !== args.formId) {
			this._formId = args.formId
			this._loading = true
			locator.contactFormFacade
				   .loadContactForm(args.formId)
				   .then(contactForm => {
					   this._contactForm = contactForm
					   lang.setLanguage(getLanguage(this._contactForm.languages.map(l => downcast(l.code)))).finally(() => {
						   let language = getDefaultContactFormLanguage(contactForm.languages)
						   document.title = language.pageTitle
						   this._headerHtml = htmlSanitizer.sanitizeHTML(language.headerHtml, {
							   blockExternalContent: false,
						   }).text
						   this._footerHtml = htmlSanitizer.sanitizeHTML(language.footerHtml, {
							   blockExternalContent: false,
						   }).text
						   this._helpHtml = htmlSanitizer.sanitizeHTML(language.helpHtml, {
							   blockExternalContent: false,
						   }).text
						   this._loading = false
						   m.redraw()
					   })
				   })
				   .catch(
					   ofClass(NotFoundError, () => {
						   this._loading = false
						   this._contactForm = null
						   m.redraw()
					   }),
				   )
		}
	}
}

export const contactFormView: ContactFormView = new ContactFormView()