import { MessageDispatcher, Request } from "../api/common/threading/MessageDispatcher.js"
import { CrossOriginTransport } from "../api/common/threading/CrossOriginTransport.js"
import { isLegacyDomain, LoginViewModel } from "./LoginViewModel.js"
import m from "mithril"

export const enum MigrationState {
	GettingCredentials,
	WaitingForInput,
	Transferring,
	Complete,
}

/** should only ever be used in contexts where we were opened as a new tab from the legacy domain and we're the new domain, or
 * as a new tab from the new domain and we're the old domain.*/
export class CredentialsMigrationViewModel {
	private aborted: boolean = false
	initPromise: Promise<void>
	migrationState: MigrationState = MigrationState.GettingCredentials

	private transport: CrossOriginTransport<any, any> | null = null
	private dispatcher: MessageDispatcher<any, any> | null = null

	constructor(readonly logins: LoginViewModel, private readonly parentOrigin: string) {
		this.initPromise = this.logins.init().then(() => {
			this.migrationState = MigrationState.WaitingForInput
			m.redraw()
		})
		logins.init().then(() => (this.migrationState = MigrationState.WaitingForInput))

		if (isLegacyDomain()) {
		} else {
		}
	}

	async executeMigration(): Promise<void> {
		this.migrationState = MigrationState.Transferring
		console.log("attempting credentials migration")
		if (this.aborted) return
		try {
			if (isLegacyDomain()) {
				await this.executeMigrationAsOldDomain()
			} else {
				await this.executeMigrationAsNewDomain()
			}
		} catch (e) {
			if (this.aborted) return
			console.log("error during migration", e)
		} finally {
			this.migrationState = MigrationState.Complete
		}
	}

	/** notify the other side that this tab is going away in some way. */
	async cancelMigration(): Promise<void> {
		this.dispatcher?.postRequest(new Request("abort", []))
		this.transport?.dispose()
	}

	private async executeMigrationAsOldDomain(): Promise<void> {
		this.transport = new CrossOriginTransport<"credentials", "abort" | "ready">(window.opener, this.parentOrigin)
		const commands = {
			abort: async () => (this.aborted = true),
			ready: async () => {
				const allCredentials = await this.logins.getAllCredentials()
				await this.dispatcher?.postRequest(new Request("credentials", [allCredentials]))
				if (this.aborted) return
				await this.logins.deleteAllCredentials()
			},
		}
		this.dispatcher = new MessageDispatcher(this.transport, commands, "tab-main")
		// not doing this through the dispatcher, the other side is not listening yet.
		window.opener.postMessage("init", this.parentOrigin)
	}

	private async executeMigrationAsNewDomain(): Promise<void> {
		console.log(this.parentOrigin)
		this.transport = new CrossOriginTransport(window.opener, this.parentOrigin)
		const commands = {
			credentials: async (req: Request<"credentials">) => {
				await this.logins.addAllCredentials(req.args[0])
				await this.dispatcher?.postRequest(new Request("done", []))
				this.transport?.dispose()
				m.route.set("/login")
			},
		}
		this.dispatcher = new MessageDispatcher(this.transport, commands, "tab-main")
		window.opener.postMessage("init", this.parentOrigin)
	}
}
