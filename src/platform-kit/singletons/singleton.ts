import { AppType, EnvProvider, EnvType } from "@tutao/app-env"
import { ClientDetector } from "../app-env/boot/ClientDetector"
import { assert, assertNotNull, isNull, Nullable, structuredClone, TsString } from "@tutao/lang-api"

export class Singletons {
	private static _envProvider: Nullable<EnvProvider> = null
	private static _clientDetector: Nullable<ClientDetector> = null

	public static async init(userAgent: TsString, platform: TsString, appType: AppType): Promise<void> {
		Singletons._envProvider = new EnvProvider(assertNotNull(globalThis.env, "global env is not yet defined"))
		Singletons._clientDetector = await ClientDetector.init(Singletons.envProvider, userAgent, platform, appType)
	}

	public static get clientDetector(): ClientDetector {
		return assertNotNull(Singletons._clientDetector, "ClientDetector is not yet initialized")
	}

	public static get envProvider(): EnvProvider {
		if (isNull(Singletons._envProvider)) {
			Singletons._envProvider = new EnvProvider(assertNotNull(globalThis.env, "global env is not yet defined"))
		}
		return Singletons._envProvider
	}

	public static initClientDetectorForTest(): void {
		assert(EnvProvider.isTest(), "This method is only supposed to be used from test")
		Singletons._clientDetector = new ClientDetector(new EnvProvider(globalThis.env), "", AppType.Calendar, false, "")
	}

	public static async withOverriddenEnvForTest<R>(override: Partial<EnvType>, action: () => R): Promise<R> {
		if (!Singletons.envProvider.isTest()) {
			throw new Error("This method is only meant for testing")
		}

		const previousEnv = structuredClone(globalThis.env)
		;(globalThis.env satisfies EnvType) = Object.assign(structuredClone(globalThis.env), override)
		;(Singletons.envProvider satisfies EnvProvider) = new EnvProvider(globalThis.env)
		try {
			return await action()
		} finally {
			;(globalThis.env satisfies EnvType) = previousEnv
			;(Singletons.envProvider satisfies EnvProvider) = new EnvProvider(globalThis.env)
		}
	}
}
