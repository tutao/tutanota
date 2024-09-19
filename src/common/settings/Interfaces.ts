import { Children, Component } from "mithril"
import { EntityUpdateData } from "../api/common/utils/EntityUpdateUtils.js"
import { TopLevelAttrs } from "../../TopLevelView.js"
import { DrawerMenuAttrs } from "../gui/nav/DrawerMenu.js"
import { AppHeaderAttrs } from "../gui/Header.js"
import { LoginController } from "../api/main/LoginController.js"

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

export interface CalendarSettingsViewAttrs extends TopLevelAttrs {
	header: AppHeaderAttrs
	logins: LoginController
}
