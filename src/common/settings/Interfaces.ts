import { Children, Component } from "mithril"
import { TopLevelAttrs } from "../../ui/base/TopLevelView.js"
import { DrawerMenuAttrs } from "../gui/nav/DrawerMenu.js"
import { AppHeaderAttrs } from "../../ui/Header.js"
import { LoginController } from "../api/main/LoginController.js"
import { EntityUpdateData } from "@tutao/instance-pipeline"
import { EventController } from "../api/main/EventController"
import { DomainConfigProvider } from "../api/common/DomainConfigProvider"
import { SettingsFolder } from "./SettingsFolder"
import { Translation } from "../../ui/utils/LanguageViewModel"

/** UI component shown in the second column of settings. */
export interface UpdatableSettingsViewer extends Component {
	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown>
}

/** UI component shown in the third column of settings. Not actually a Mithril component. */
export interface UpdatableSettingsDetailsViewer {
	renderView(): Children

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<unknown>
}

export interface SettingsViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	logins: LoginController
}

export interface SettingsViewSection {
	name: Translation
	settings: readonly SettingsFolder<unknown>[]
}

export interface MobileSettingsViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	logins: LoginController
	eventController: EventController
	domainConfigProvider: DomainConfigProvider
	settingSections: readonly SettingsViewSection[]
	backUrl: string
}
