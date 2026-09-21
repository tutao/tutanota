import { buildConnector } from "undici"
import type { Agent } from "undici"
import { createUndiciConnector } from "compliant-eyeballs/undici"
import { HappyEyeballsHttpsAgent as ConnectionHttpsAgent } from "compliant-eyeballs/agents"

export function createHappyEyeballsConnector(): NonNullable<Agent.Options["connect"]> {
	return createUndiciConnector({
		allowH2: true,
		keepAlive: true,
		keepAliveInitialDelay: 60_000,
		// An existing tunnel stays with the integration that created it.
		fallbackConnector: buildConnector({ allowH2: true, timeout: 20_000 }),
	})
}

export class HappyEyeballsHttpsAgent extends ConnectionHttpsAgent {
	constructor() {
		super({ keepAlive: true, scheduling: "lifo" })
	}
}
