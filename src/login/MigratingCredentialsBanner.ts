import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { getNewDomainOrigin, getOldDomainOrigin, isLegacyDomain, LoginViewModel } from "./LoginViewModel.js"
import { MessageDispatcher, Request } from "../api/common/threading/MessageDispatcher.js"
import { CrossOriginTransport } from "../api/common/threading/CrossOriginTransport.js"
import { theme } from "../gui/theme.js"
import { lang } from "../misc/LanguageViewModel.js"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { Icons } from "../gui/base/icons/Icons.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { Dialog } from "../gui/base/Dialog.js"

export type CredentialsBannerAttrs = {
	viewModel: LoginViewModel
}

export class MigratingCredentialsBanner implements Component<CredentialsBannerAttrs> {
	private transport: CrossOriginTransport<any, any> | null = null
	private dispatcher: MessageDispatcher<any, any> | null = null
	private childOrigin!: string
	private migrationPromise: DeferredObject<void> = defer()

	oncreate(vnode: VnodeDOM<CredentialsBannerAttrs>): any {
		this.childOrigin = isLegacyDomain() ? getNewDomainOrigin() : getOldDomainOrigin()
		console.log("child", this.childOrigin)
	}

	onremove(vnode: VnodeDOM<CredentialsBannerAttrs>) {
		// close channel - we don't want to handle inter-frame
		console.log("done with credentialsframe")
		this.dispatcher?.postRequest(new Request("abort", [])).then(() => this.transport?.dispose())
	}

	view(vnode: Vnode<CredentialsBannerAttrs>) {
		const legacy = isLegacyDomain()
		// do not show anything on the new domain if we already attempted migration or we got directly
		// to the login page from being opened by another this/tab (this happens if there are no creds on old domain)
		if (!legacy && (vnode.attrs.viewModel.hasAttemptedCredentials() || window.opener != null)) return null
		return m(
			".flex-center",
			m(
				".flex.col.flex-grow-shrink-auto.max-width-m.hide-outline.plr-l",
				m(".plr-l.pt-s.pb.content-bg.border-radius-big", { style: { color: theme.navigation_button } }, [
					m(".flex.row.items-center", [m("h6.flex-grow.b.mb-s", lang.get("tutanotaToTuta_msg")), this.renderDismissButton(vnode.attrs)]),
					m("div", legacy ? lang.get("movedDomainLegacy_msg") : lang.get("getCredsFromLegacy_msg")),
					this.renderLinkToOtherDomain(vnode),
				]),
			),
		)
	}

	private renderDismissButton({ viewModel }: CredentialsBannerAttrs): Children {
		// on the legacy domain, this is not dismissible
		if (isLegacyDomain()) return null
		return m(
			"",
			{ style: { "margin-right": "-15px", "margin-top": "-7px" } },
			m(IconButton, {
				title: "close_alt",
				click: () => viewModel.setHasAttemptedCredentialsFlag(),
				icon: Icons.Close,
				size: ButtonSize.Compact,
			} satisfies IconButtonAttrs),
		)
	}

	private renderLinkToOtherDomain(vnode: Vnode<CredentialsBannerAttrs>): Children {
		const href = this.childOrigin + "/migrate"
		return m(
			"a",
			{
				href,
				style: { cursor: "pointer" },
				onclick: (e: Event) => {
					e.preventDefault()
					this.startMigration(vnode)
				},
			},
			href,
		)
	}

	/** open the other domain in a new tab and migrate the credentials to the new one */
	startMigration(vnode: Vnode<CredentialsBannerAttrs>) {
		showProgressDialog("pleaseWait_msg", this.migrationPromise.promise)
		if (isLegacyDomain()) {
			if (vnode.attrs.viewModel.getAllCredentials().length === 0) {
				// no credentials, nothing to migrate, but we still want to have people
				// use the new domain. replaces current tab with the new domain.
				window.open(this.childOrigin, "_self")
			} else {
				this.openChildFromLegacyDomain(vnode.attrs.viewModel)
			}
		} else {
			this.openChildFromNewDomain(vnode.attrs.viewModel)
		}
	}

	private openChildFromLegacyDomain(viewModel: LoginViewModel) {
		const childURL = new URL(this.childOrigin)
		childURL.pathname = "migrate"

		const handleInitialMessageAsLegacyDomain = (msg: MessageEvent) => {
			console.log("got first message as legacy:", msg)
			window.removeEventListener("message", handleInitialMessageAsLegacyDomain)
			if (msg.source == null) {
				console.log("msg has no src")
				return
			}
			if (this.childOrigin == null) {
				console.log("new domain received message before setting childOrigin?")
				return
			}
			if (msg.origin !== this.childOrigin) {
				console.log("new domain received message from unexpected origin:", msg.origin)
				return
			}
			this.transport = new CrossOriginTransport<"credentials" | "abort", "done">(msg.source as Window, this.childOrigin)
			const commands = {
				done: async (_req: Request<"done">) => {
					this.migrationPromise.promise.then(() => {
						viewModel.deleteAllCredentials()
						// closing the tab with a click does not work here since we did not open the tab in a script
						Dialog.deadEnd("credentialMigrationDone_msg")
					})
					this.migrationPromise.resolve()
					this.transport?.dispose()
				},
			}
			this.dispatcher = new MessageDispatcher(this.transport, commands, "main-tab")
			this.dispatcher.postRequest(new Request("credentials", [viewModel.getAllCredentials()]))
		}

		window.open(childURL, "_blank")
		window.addEventListener("message", handleInitialMessageAsLegacyDomain)
	}

	private openChildFromNewDomain(viewModel: LoginViewModel) {
		const childURL = new URL(this.childOrigin)
		childURL.pathname = "migrate"

		const handleInitialMessageAsNewDomain = (msg: MessageEvent) => {
			console.log("got first message as new:", msg)
			window.removeEventListener("message", handleInitialMessageAsNewDomain)
			if (msg.source == null) {
				console.log("msg has no src")
				return
			}
			if (this.childOrigin == null) {
				console.log("old domain received message before setting childOrigin?")
				return
			}
			if (msg.origin !== this.childOrigin) {
				console.log("old domain received message from unexpected origin:", msg.origin)
				return
			}
			const transport = new CrossOriginTransport<"abort", "credentials">(msg.source as Window, this.childOrigin)
			const commands = {
				credentials: async (req: Request<"credentials">) => {
					await viewModel.addAllCredentials(req.args[0])
					this.migrationPromise.resolve()
					transport.dispose()
					m.route.set("/login")
				},
				abort: () => this.migrationPromise.resolve(),
			}
			this.dispatcher = new MessageDispatcher(transport, commands, "main-tab")
			this.dispatcher.postRequest(new Request("ready", []))
		}

		const child = window.open(childURL, "_blank")
		setInterval(() => {
			if (child?.closed) {
				this.transport?.dispose()
				this.migrationPromise.resolve()
			}
		}, 1000)
		window.addEventListener("message", handleInitialMessageAsNewDomain)
	}
}
