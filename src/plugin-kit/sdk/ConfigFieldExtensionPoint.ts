import { ButtonConfiguration, ButtonRef, ExtensionPoint } from "./PluginHostApi"

export interface ConfigFieldExtension {
	updateCustomerConfig(globalConfigJson: string): void
}
