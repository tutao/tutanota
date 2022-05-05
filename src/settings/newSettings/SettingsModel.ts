import m, {Children, Component} from "mithril";
import stream from "mithril/stream";
import Stream from "mithril/stream";
import type {IUserController} from "../../api/main/UserController";
import type {EntityUpdateData} from "../../api/main/EventController";
import {LoginSettingsSection, SessionSettings} from "./LoginSettingsSection";
import type {TableAttrs} from "../../gui/base/TableN";
import {TableN} from "../../gui/base/TableN";
import type {TranslationKey} from "../../misc/LanguageViewModel";
import {lang} from "../../misc/LanguageViewModel";
import {GlobalSettingsSection} from "./GlobalSettingsSection";
import {MailDropdownSettingsSection, MailSettingsSection} from "./MailSettingsSection";
import {WhitelabelSettingsSection} from "./WhitelabelSettingsSection";
import {SubscriptionSettingsSection} from "./SubscriptionSettingsSection";
import {PaymentSettingsSection} from "./PaymentSettingsSection";
import {GiftCardSettingsSection} from "./GiftCardSettingsSection";
import {ExtensionsSettingsSection} from "./ExtensionsSettingsSection";
import {locator} from "../../api/main/MainLocator";
import {AppearanceSettingsSection} from "./AppearanceSettingsSection";

export interface SettingsSection {
	heading: string;
	category: string;
	settingsValues: Array<SettingsValue<any>>;

	entityEventReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<unknown>;
}

// FIXME: wtf is SettingsValue, there are some expectations from T?
export type SettingsValue<T> = {
	name: TranslationKey;
	// | lazy<string>,
	component: Class<Component>;
	attrs: T;
};

export class SettingsModel {
	sections: Array<SettingsSection>;
	allSections: Array<SettingsSection>;
	selectedSection: Stream<SettingsSection | null> = stream(null);

	constructor(userController: IUserController) {
		this.sections = [];
		this.sections.push(new LoginSettingsSection(userController));
		this.sections.push(new SessionSettings());
		this.sections.push(new MailSettingsSection(userController, locator.entityClient, locator.indexerFacade));
		this.sections.push(new MailDropdownSettingsSection(userController, locator.entityClient));
		this.sections.push(new AppearanceSettingsSection(userController, locator, locator.entityClient));
		this.sections.push(new GlobalSettingsSection(userController, locator.entityClient, locator.customerFacade));
		this.sections.push(new WhitelabelSettingsSection(userController, locator.entityClient));
		this.sections.push(new SubscriptionSettingsSection(locator.bookingFacade));
		this.sections.push(new GiftCardSettingsSection(userController));
		this.sections.push(new ExtensionsSettingsSection(locator.customerFacade));
		this.sections.push(new PaymentSettingsSection(locator.entityClient, locator.bookingFacade, locator.customerFacade, locator.fileController));
		this.allSections = this.sections;
	}

	setSelectedSection(section: SettingsSection) {
		this.selectedSection(section);
	}

	getSelectedSection(): SettingsSection | null | undefined {
		return this.selectedSection();
	}

	getSelectedContent(): Array<SettingsValue<any>> | null | undefined {
		return null;
	}
}

export type SettingsTableAttrs = {
	tableHeading: TranslationKey;
	tableAttrs: TableAttrs;
}

export class SettingsTable {

	constructor(
		private readonly tableHeading: TranslationKey,
		private readonly tableAttrs: TableAttrs
	) {
	}

	view(): Children {
		return [m(".h5", lang.get(this.tableHeading)), m(TableN, this.tableAttrs)];
	}

}