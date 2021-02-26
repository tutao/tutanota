// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {worker} from "../../api/main/WorkerClient"
import {animations, opacity} from "../../gui/animation/Animations"
import {NotFoundError} from "../../api/common/error/RestError"
import {downcast, neverNull} from "../../api/common/utils/Utils"
import {ContactFormRequestDialog} from "./ContactFormRequestDialog"
import {Dialog} from "../../gui/base/Dialog"
import {getLanguage, lang} from "../../misc/LanguageViewModel"
import {progressIcon} from "../../gui/base/Icon"
import {InfoView} from "../../gui/base/InfoView"
import {getDefaultContactFormLanguage} from "../../contacts/ContactFormUtils"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {renderPrivacyAndImprintLinks} from "../LoginView"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {header} from "../../gui/base/Header"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Keys} from "../../api/common/TutanotaConstants"
import type {ContactForm} from "../../api/entities/tutanota/ContactForm"

assertMainOrNode()

class ContactFormView {

	view: Function;
	_contactForm: ?ContactForm;
	_moreInformationDialog: Dialog;
	_formId: string;
	_loading: boolean;
	_helpHtml: ?string;
	_headerHtml: ?string;
	_footerHtml: ?string;

	constructor() {
		this._contactForm = null
		this._helpHtml = null
		this._headerHtml = null
		this._footerHtml = null

		let closeAction = () => this._moreInformationDialog.close()

		const moreInfoHeaderBarAttrs: DialogHeaderBarAttrs = {
			right: [{label: 'ok_action', click: closeAction, type: ButtonType.Secondary}],
			middle: () => lang.get("moreInformation_action")
		}

		this._moreInformationDialog = Dialog.largeDialog(moreInfoHeaderBarAttrs, {
			view: () => {
				return m(".pb", m.trust(neverNull(this._helpHtml))) // is sanitized in updateUrl
			}
		}).addShortcut({
			key: Keys.ESC,
			exec: closeAction,
			help: "close_alt"
		}).setCloseHandler(closeAction)

		this.view = (): VirtualElement => {
			return m(".main-view.flex.col", [
				m(header),
				m(".flex-center.scroll",
					m(".flex-grow-shrink-auto.max-width-l.third.pb.plr-l", this._getContactFormContent()))
			])
		}
	}

	_getContactFormContent(): VirtualElement {
		if (this._loading) {
			return m(".flex-center.items-center.pt-l", {
				onbeforeremove: vnode => animations.add(vnode.dom, opacity(1, 0, false))
			}, progressIcon())
		} else if (this._contactForm) {
			let language = getDefaultContactFormLanguage(this._contactForm.languages)
			return m("", {
				oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false))
			}, [
				(language.pageTitle) ? m("h1.center", language.pageTitle) : null,
				m("", m.trust(neverNull(this._headerHtml))), // is sanitized in updateUrl
				m(".flex.justify-center", [
					m(".max-width-m.flex-grow-shrink-auto", [
						m(".pt-l", m(ButtonN, {
							label: "createContactRequest_action",
							click: () => new ContactFormRequestDialog(neverNull(this._contactForm)).show(),
							type: ButtonType.Login,
						})),
						m(".pt-l", m(ButtonN, {
							label: "readResponse_action",
							click: () => m.route.set("/login"),
							type: ButtonType.Login,
						})),
						(this._helpHtml)
							? m(".pt-l.flex-center", m(ButtonN, {
								label: "moreInformation_action",
								click: () => this._moreInformationDialog.show(),
								type: ButtonType.Secondary,
							}))
							: null,
					])
				]),
				m(".pt-l", m.trust(neverNull(this._footerHtml))), // is sanitized in updateUrl
				renderPrivacyAndImprintLinks()
			])
		} else {
			return m(new InfoView(() => "404", () => [
				m("p", lang.get("notFound404_msg")),
				m(".pb")
			]))
		}
	}

	updateUrl(args: Object) {
		if (this._formId !== args.formId) {
			this._formId = args.formId
			this._loading = true
			worker.initialized.then(() => worker.loadContactFormByPath(args.formId).then(contactForm => {
				this._contactForm = contactForm
				lang.setLanguage(getLanguage(this._contactForm.languages.map(l => downcast(l.code)))).finally(() => {
					let language = getDefaultContactFormLanguage(contactForm.languages)
					document.title = language.pageTitle

					this._headerHtml = htmlSanitizer.sanitize(language.headerHtml, {blockExternalContent: false}).text
					this._footerHtml = htmlSanitizer.sanitize(language.footerHtml, {blockExternalContent: false}).text
					this._helpHtml = htmlSanitizer.sanitize(language.helpHtml, {blockExternalContent: false}).text

					this._loading = false
					m.redraw()
				})
			}).catch(NotFoundError, e => {
				this._loading = false
				this._contactForm = null
				m.redraw()
			}))
		}
	}
}

export const contactFormView: ContactFormView = new ContactFormView()
