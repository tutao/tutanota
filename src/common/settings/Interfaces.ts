import { Children, Component } from "mithril"
import { TopLevelAttrs } from "../../TopLevelView.js"
import { DrawerMenuAttrs } from "../gui/nav/DrawerMenu.js"
import { AppHeaderAttrs } from "../gui/Header.js"
import { LoginController } from "../api/main/LoginController.js"
import { entityUpdateUtils } from "@tutao/typerefs"
import { CredentialsProvider } from "../misc/credentials/CredentialsProvider"
import { MobileSystemFacade } from "../native/common/generatedipc/MobileSystemFacade"
import { EventController } from "../api/main/EventController"
import { MobilePaymentsFacade } from "../native/common/generatedipc/MobilePaymentsFacade"
import { DomainConfigProvider } from "../api/common/DomainConfigProvider"
import { EntityClient } from "../api/common/EntityClient"
import { ThemeController } from "../gui/ThemeController"
import { WhitelabelThemeGenerator } from "../gui/WhitelabelThemeGenerator"

/** UI component shown in the second column of settings. */
export interface UpdatableSettingsViewer extends Component {
	entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>): Promise<unknown>
}

/** UI component shown in the third column of settings. Not actually a Mithril component. */
export interface UpdatableSettingsDetailsViewer {
	renderView(): Children

	entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>): Promise<unknown>
}

export interface SettingsViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	logins: LoginController
}

export interface CalendarSettingsViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	logins: LoginController
	credentialsProvider: CredentialsProvider
	systemFacade: MobileSystemFacade
	eventController: EventController
	mobilePaymentsFacade: MobilePaymentsFacade
	domainConfigProvider: DomainConfigProvider
	entityClient: EntityClient
	themeController: ThemeController
	whitelabelThemeGenerator: WhitelabelThemeGenerator
}
