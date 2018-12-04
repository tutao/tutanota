// @flow
import m from "mithril"
import {Button, ButtonType} from "../gui/base/Button"
import {assertMainOrNode} from "../api/Env"
import {worker} from "../api/main/WorkerClient"
import {animations, opacity} from "../gui/animation/Animations"
import {NotFoundError} from "../api/common/error/RestError"
import {neverNull} from "../api/common/utils/Utils"
import {ContactFormRequestDialog} from "./ContactFormRequestDialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {Keys} from "../misc/KeyManager"
import {progressIcon} from "../gui/base/Icon"
import {InfoView} from "../gui/base/InfoView"
import {getDefaultContactFormLanguage} from "../contacts/ContactFormUtils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {renderImprintLink} from "./ExternalLoginView"

assertMainOrNode()

class ContactFormView {

	view: Function;
	_contactForm: ?ContactForm;
	_createRequestButton: Button;
	_moreInformationButton: Button;
	_readResponseButton: Button;
	_moreInformationDialog: Dialog;
	_formId: string;
	_loading: boolean;
	_helpHtml: ?string;
	_headerHtml: ?string;
	_footerHtml: ?string;

	constructor() {
		this._createRequestButton = new Button('createContactRequest_action', () => {
			new ContactFormRequestDialog(neverNull(this._contactForm)).show()
		}).setType(ButtonType.Login)

		this._contactForm = null
		this._helpHtml = null
		this._headerHtml = null
		this._footerHtml = null

		let closeAction = () => this._moreInformationDialog.close()

		let moreInfoHeaderBar = new DialogHeaderBar()
			.addRight(new Button('ok_action', closeAction).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("moreInformation_action"))

		this._moreInformationDialog = Dialog.largeDialog(moreInfoHeaderBar, {
			view: () => {
				return m(".pb", m.trust(neverNull(this._helpHtml))) // is sanitized in updateUrl
			}
		}).addShortcut({
			key: Keys.ESC,
			exec: closeAction,
			help: "close_alt"
		}).setCloseHandler(closeAction)

		this._readResponseButton = new Button('readResponse_action', () => m.route.set("/login")).setType(ButtonType.Login)
		this._moreInformationButton = new Button('moreInformation_action', () => this._moreInformationDialog.show()).setType(ButtonType.Secondary)

		this.view = (): VirtualElement => {
			return m(".main-view.flex-center.scroll", m(".flex-grow-shrink-auto.max-width-l.third.pb.plr-l", this._getContactFormContent()))
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
						m(".pt-l", m(this._createRequestButton)),
						m(".pt-l", m(this._readResponseButton)),
						(this._helpHtml) ? m(".pt-l.flex-center", m(this._moreInformationButton)) : null,
					])
				]),
				m(".pt-l", m.trust(neverNull(this._footerHtml))), // is sanitized in updateUrl
				renderImprintLink()
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
				lang.setLanguage(lang.getLanguage(this._contactForm.languages.map(l => l.code))).finally(() => {
					let language = getDefaultContactFormLanguage(contactForm.languages)
					document.title = language.pageTitle

					this._headerHtml = htmlSanitizer.sanitize(language.headerHtml, false).text
					this._footerHtml = htmlSanitizer.sanitize(language.footerHtml, false).text
					this._helpHtml = htmlSanitizer.sanitize(language.helpHtml, false).text

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
