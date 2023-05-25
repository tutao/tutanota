import m, { Children } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { BookingItemFeatureType } from "../../api/common/TutanotaConstants"
import { ActionBar } from "../../gui/base/ActionBar"
import * as ContactFormEditor from "./ContactFormEditor"
import type { ContactForm } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactFormLanguage, createContactForm } from "../../api/entities/tutanota/TypeRefs.js"
import { loadGroupInfos } from "../LoadingUtils"
import { Icons } from "../../gui/base/icons/Icons"
import { Dialog } from "../../gui/base/Dialog"
import { isNotNull, neverNull } from "@tutao/tutanota-utils"
import { GroupInfo, GroupInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { getContactFormUrl, getDefaultContactFormLanguage } from "./ContactFormUtils.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import type { EntityUpdateData } from "../../api/main/EventController"
import { getGroupInfoDisplayName } from "../../api/common/utils/GroupUtils"
import { showBuyDialog } from "../../subscription/BuyDialog"
import { TextField } from "../../gui/base/TextField.js"
import { UpdatableSettingsDetailsViewer } from "../SettingsView"
import { assertMainOrNode } from "../../api/common/Env"
import { locator } from "../../api/main/MainLocator"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"

assertMainOrNode()

export class ContactFormViewer implements UpdatableSettingsDetailsViewer {
	private mailGroupInfo: GroupInfo | null = null
	private participationGroupInfos: GroupInfo[] | null = null
	private readonly language: ContactFormLanguage

	constructor(
		readonly contactForm: ContactForm,
		private readonly brandingDomain: string | null,
		private readonly newContactFormIdReceiver: (id: Id) => unknown,
	) {
		this.language = getDefaultContactFormLanguage(this.contactForm.languages)

		locator.entityClient.load(GroupInfoTypeRef, neverNull(contactForm.targetGroupInfo)).then((groupInfo) => {
			this.mailGroupInfo = groupInfo
			m.redraw()
		})
		loadGroupInfos(contactForm.participantGroupInfos).then((groupInfos) => {
			this.participationGroupInfos = groupInfos
			m.redraw()
		})
	}

	renderView(): Children {
		return [
			m("#user-viewer.fill-absolute.scroll.plr-l.pb-floating", [
				m(".flex-space-between.pt", [m(".h4", lang.get("emailProcessing_label")), this.renderActionBar()]),
				m(TextField, {
					label: "receivingMailbox_label",
					value: this.mailGroupInfo ? getGroupInfoDisplayName(this.mailGroupInfo) : lang.get("loading_msg"),
					disabled: true,
				}),
				this.renderParticipation(),
				m(".h4.mt-l", lang.get("display_action")),
				m(TextField, {
					label: "url_label",
					value: getContactFormUrl(this.brandingDomain, this.contactForm.path),
					disabled: true,
				} as const),
				m(TextField, {
					label: "pageTitle_label",
					value: this.language.pageTitle,
					disabled: true,
				}),
			]),
		]
	}

	private renderActionBar(): Children {
		const buttons: (IconButtonAttrs | null)[] = [
			this.brandingDomain
				? {
						title: "edit_action",
						click: () => ContactFormEditor.show(this.contactForm, false, this.newContactFormIdReceiver),
						icon: Icons.Edit,
				  }
				: null,
			this.brandingDomain
				? {
						title: "copy_action",
						click: () => this.copy(),
						icon: Icons.Copy,
				  }
				: null,
			{
				title: "delete_action",
				click: () => this.delete(),
				icon: Icons.Trash,
			},
		]
		return m(ActionBar, {
			buttons: buttons.filter(isNotNull),
		})
	}

	private renderParticipation(): Children {
		if (this.participationGroupInfos == null || this.participationGroupInfos.length === 0) {
			return null
		} else {
			const mailGroupNames = this.participationGroupInfos.map((groupInfo) => getGroupInfoDisplayName(groupInfo))
			return m(
				".mt-l",
				m(TextField, {
					label: "responsiblePersons_label",
					value: mailGroupNames.join("; "),
					disabled: true,
				}),
			)
		}
	}

	private copy() {
		const newForm = createContactForm()
		// copy the instances as deep as necessary to make sure that the instances are not used in two different entities and changes affect both entities
		newForm.targetGroupInfo = this.contactForm.targetGroupInfo
		newForm.participantGroupInfos = this.contactForm.participantGroupInfos.slice()
		newForm.path = "" // do not copy the path

		newForm.languages = this.contactForm.languages.map((l) => Object.assign({}, l))
		ContactFormEditor.show(newForm, true, this.newContactFormIdReceiver)
	}

	private delete() {
		Dialog.confirm("confirmDeleteContactForm_msg").then((confirmed) => {
			if (confirmed) {
				showProgressDialog(
					"pleaseWait_msg",
					showBuyDialog({
						featureType: BookingItemFeatureType.ContactForm,
						bookingText: "cancelContactForm_label",
						count: -1,
						freeAmount: 0,
						reactivate: false,
					}).then((accepted) => {
						if (accepted) {
							return locator.entityClient.erase(this.contactForm)
						}
					}),
				)
			}
		})
	}

	entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		// the contact form list view creates a new viewer if my contact form is updated
		return Promise.resolve()
	}
}
