export interface IPlugin {
	readonly name: string
	readonly description: string
	readonly id: string
	initalize(): void // register functionality
	start(): void // start plugin
	shutdown(): void // clean up resources
}
