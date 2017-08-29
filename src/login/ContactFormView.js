// @flow
import m from "mithril"
import {Button, ButtonType} from "../gui/base/Button"
import {assertMainOrNode} from "../api/Env"
import {worker} from "../api/main/WorkerClient"
import {opacity, animations} from "../gui/animation/Animations"
import {NotFoundError} from "../api/common/error/RestError"
import {neverNull} from "../api/common/utils/Utils"
import {ContactFormRequestDialog} from "./ContactFormRequestDialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {NavBar} from "../gui/base/NavBar"
import {Keys} from "../misc/KeyManager"
import {progressIcon} from "../gui/base/Icon"
import {InfoView} from "../gui/base/InfoView"

assertMainOrNode()

export class ContactFormView {

	view: Function;
	buttonBar: NavBar;
	_contactForm: ?ContactForm;
	_createRequestButton: Button;
	_moreInformationButton: Button;
	_readResponseButton: Button;
	_moreInformationDialog: Dialog;
	_formId: string;
	_loading: boolean;


	constructor() {
		this._createRequestButton = new Button('createContactRequest_action', () => {
			new ContactFormRequestDialog(neverNull(this._contactForm)).show()
		}).setType(ButtonType.Login)

		this._contactForm = null

		let moreInfoHeaderBar = new DialogHeaderBar()
			.addRight(new Button('ok_action', () => this._moreInformationDialog.close()).setType(ButtonType.Secondary))
			.setMiddle(() => lang.get("moreInformation_action"))
		this._moreInformationDialog = Dialog.largeDialog(moreInfoHeaderBar, {
			view: () => m(".pb", m.trust(neverNull(this._contactForm).helpHtml))
		}).addShortcut({
			key: Keys.ESC,
			exec: () => this._moreInformationDialog.close(),
			help: "close_alt"
		})

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
			return m("", {
				oncreate: vnode => animations.add(vnode.dom, opacity(0, 1, false))
			}, [
				(this._contactForm && this._contactForm.pageTitle) ? m("h1.center", neverNull(this._contactForm).pageTitle) : null,
				neverNull(this._contactForm).headerHtml ? m("", m.trust(neverNull(this._contactForm).headerHtml)) : null, // header
				m(".flex.justify-center", [
					m(".max-width-m.flex-grow-shrink-auto", [
						m(".pt-l", m(this._createRequestButton)),
						m(".pt-l", m(this._readResponseButton)),
						m(".pt-l.flex-center", m(this._moreInformationButton)),
					])
				]),
				m(".pt-l", m.trust(neverNull(this._contactForm).footerHtml)), // footer
				m(".pb")
			])
		} else {
			return m(new InfoView(() => "404", () => [
				m("p", lang.get("notFound404_msg")),
				m(".pb")
			]))
		}
	}

	updateUrl(args: Object) {
		document.title = "Tutanota"
		if (this._formId != args.formId) {
			this._formId = args.formId
			this._loading = true
			worker.initialized.then(() => worker.loadContactFormByPath(args.formId).then(contactForm => {
				document.title = contactForm.pageTitle
				this._contactForm = contactForm
				this._loading = false
				m.redraw()
			}).catch(NotFoundError, e => {
				this._loading = false
				this._contactForm = null
				m.redraw()
			}))
		}
	}
}

export const contactFormView: ContactFormView = new ContactFormView()