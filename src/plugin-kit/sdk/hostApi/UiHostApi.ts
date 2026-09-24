import { ButtonConfiguration, ButtonRef, ConfigFieldConfiguration } from "./PluginHostApi"

export interface UiHostApi {
	registerButton(config: ButtonConfiguration): Promise<ButtonRef>
	registerConfigFields(config: ConfigFieldConfiguration[]): Promise<void>
}
