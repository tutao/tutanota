import { PluginMail } from "./PluginMail"

export interface MailButtonExtension {
	mailButtonClicked(mail: PluginMail): void
}
