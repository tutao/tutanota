import { EnvProvider } from "@tutao/app-env"

export class Singletons {
	public static readonly envProvider: EnvProvider = new EnvProvider(globalThis.env)
}
