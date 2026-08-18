import { RpcTarget } from "capnweb"

export class Greeter extends RpcTarget {
	greet(name: string): string {
		return `Hello, ${name}!`
	}
}
