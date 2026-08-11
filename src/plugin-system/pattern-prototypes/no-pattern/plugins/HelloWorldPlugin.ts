import { IPlugin } from "../IPlugin"

export class HelloWorldPlugin implements IPlugin {
	readonly description: string
	readonly id: string
	readonly name: string

	initalize(): void {
		console.log("Getting ready to says it")
	}

	start(): void {
		console.log("Hello World")
	}

	shutdown(): void {
		console.log("thats it folks")
	}
}
