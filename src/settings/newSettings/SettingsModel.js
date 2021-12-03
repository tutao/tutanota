// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {IUserController} from "../../api/main/UserController"
import type {EntityUpdateData} from "../../api/main/EventController"
import {LoginSettingsSection, SessionSettings} from "./LoginSettingsSection"
import type {TableAttrs} from "../../gui/base/TableN"
import {TableN} from "../../gui/base/TableN"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {GlobalSettingsSection} from "./GlobalSettingsSection"
import {MailDropdownSettingsSection, MailSettingsSection} from "./MailSettingsSection"
import {AppearanceSettingsSection} from "./AppearanceSettingsSection"
import {WhitelabelSettingsSection} from "./WhitelabelSettingsSection"
import {SubscriptionSettingsSection} from "./SubscriptionSettingsSection"
import {PaymentSettingsSection} from "./PaymentSettingsSection"
import {GiftCardSettingsSection} from "./GiftCardSettingsSection"
import {ExtensionsSettingsSection} from "./ExtensionsSettingsSection"
import type {lazy} from "../../api/common/utils/Utils"

export interface SettingsSection {
	heading: string,
	category: string,
	settingsValues: Array<SettingsValue<any>>,

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed>
}

export type SettingsValue<T> = {
	name: TranslationKey,// | lazy<string>,
	component: Class<MComponent<T>>,
	attrs: T
}

export class SettingsModel {
	sections: Array<SettingsSection>
	allSections: Array<SettingsSection>
	selectedSection: Stream<?SettingsSection> = stream(null)

	constructor(userController: IUserController) {
		this.sections = []
		this.sections.push(new LoginSettingsSection(userController))
		this.sections.push(new SessionSettings())
		this.sections.push(new MailSettingsSection(userController))
		this.sections.push(new MailDropdownSettingsSection(userController))
		this.sections.push(new AppearanceSettingsSection(userController))
		this.sections.push(new GlobalSettingsSection(userController))
		this.sections.push(new WhitelabelSettingsSection(userController))
		this.sections.push(new SubscriptionSettingsSection())
		this.sections.push(new GiftCardSettingsSection())
		this.sections.push(new ExtensionsSettingsSection())
		this.sections.push(new PaymentSettingsSection())
		this.allSections = this.sections
	}

	setSelectedSection(section: SettingsSection) {
		this.selectedSection(section)
	}

	getSelectedSection(): ?SettingsSection {
		return this.selectedSection()
	}

	getSelectedContent(): ?Array<SettingsValue<any>> {
		return null
	}
}

export type SettingsTableAttrs = {
	tableHeading: TranslationKey,
	tableAttrs: TableAttrs
}

export class SettingsTable implements MComponent<SettingsTableAttrs> {

	view(vnode: Vnode<SettingsTableAttrs>): Children {
		const {tableHeading, tableAttrs} = vnode.attrs
		return [
			m(".h5", lang.get(tableHeading)),
			m(TableN, tableAttrs)
		]
	}
}


