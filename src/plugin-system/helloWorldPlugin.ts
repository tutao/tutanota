export interface PluginConsumerInterface {
	name: string
	author: string
	version: string

	init(): Promise<void>
	load(): Promise<void>
	unload(): Promise<void>
}

export class Plugin implements PluginConsumerInterface {
	constructor(author: string, name: string, version: string) {
		this.author = author
		this.name = name
		this.version = version
	}

	author: string
	name: string
	version: string

	init(): Promise<void> {
		console.log(`Plugin initialized...`)
		return Promise.resolve()
	}

	load(): Promise<void> {
		console.log(`Plugin loaded...`)
		return Promise.resolve()
	}

	unload(): Promise<void> {
		console.log(`Plugin unloaded...`)
		return Promise.resolve()
	}
}
