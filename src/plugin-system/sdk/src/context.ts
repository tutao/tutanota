import { ILogger } from "./logging.js"
import { Config } from "./config.js"
import { Storage } from "./storage.js"
import { Commands } from "./commands.js"
import { Events } from "./events.js"
import { Ui } from "./ui.js"

import { Mail } from "../../IHostApi.js"

export interface PluginContext {
	logger: ILogger
	config: Config
	storage: Storage
	mail: Mail
	commands: Commands
	events: Events
	ui: Ui
}
