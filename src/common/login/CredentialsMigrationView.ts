import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import m, { Children, Vnode } from "mithril"
import { CredentialsMigrationViewModel, MigrationState } from "./CredentialsMigrationViewModel.js"
import { LoginScreenHeader } from "../gui/LoginScreenHeader.js"
import { styles } from "../gui/styles.js"
import { AriaLandmarks, landmarkAttrs } from "../gui/AriaUtils.js"
import { lang } from "../misc/LanguageViewModel.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { ColumnWidth, Table, TableAttrs } from "../gui/base/Table.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { renderInfoLinks } from "../gui/RenderLoginInfoLinks.js"

export const TAG = "[CredentialsMigrationView]"

export type CredentialsMigrationViewAttrs = {
	credentialsMigrationViewModel: CredentialsMigrationViewModel
} & TopLevelAttrs

/**
 * there's two ways we can get here:
 * * the old domain opened the new domain as a new tab on this view. we want to send a "ready" event and then receive credentials, then send "done" event.
 * * the new domain opened the old domain as a new tab on this view. we want to send credentials, then prompt the user to close this tab.
 * */
export class CredentialsMigrationView extends BaseTopLevelView implements TopLevelView<CredentialsMigrationViewAttrs> {
	private viewModel!: CredentialsMigrationViewModel

	oncreate(vnode: Vnode<CredentialsMigrationViewAttrs>) {
		this.viewModel = vnode.attrs.credentialsMigrationViewModel
		window.addEventListener("beforeunload", () => this.viewModel.cancelMigration())
	}

	protected onNewUrl(args: Record<string, any>, requestedPath: string) {
		// ignore
	}

	constructor({ attrs }: Vnode<CredentialsMigrationViewAttrs>) {
		super()
		this.viewModel = attrs.credentialsMigrationViewModel
	}

	view(vnode: Vnode<CredentialsMigrationViewAttrs>): Children {
		if (window.opener == null) {
			// user navigated here through some link or so, not by our intended mechanism.
			m.route.set("/login")
			return null
		}
		return m("#login-view.main-view.flex.col.nav-bg", [
			m(LoginScreenHeader),
			m(
				".flex-grow.flex-center.scroll",
				m(
					".flex.col.flex-grow-shrink-auto.max-width-m.plr-l." + (styles.isSingleColumnLayout() ? "pt" : "pt-l"),
					{
						...landmarkAttrs(AriaLandmarks.Main, lang.get("login_label")),
						oncreate: (vnode) => {
							;(vnode.dom as HTMLElement).focus()
						},
					},
					[
						m(
							".content-bg.border-radius-big",
							{
								class: styles.isSingleColumnLayout() ? "plr-l" : "plr-2l",
							},
							m(".flex.col.pb-l.pt-l", this.renderMigrationForm()),
						),
						m(".flex-grow"),
						renderInfoLinks(),
					],
				),
			),
		])
	}

	private renderMigrationForm() {
		switch (this.viewModel.migrationState) {
			case MigrationState.GettingCredentials:
				return this.renderSpinner()
			case MigrationState.WaitingForInput:
				return this.renderTransferPrompt()
			case MigrationState.Transferring:
				return this.renderSpinner()
			case MigrationState.Complete:
				return this.renderCompleteMessage()
		}
	}

	private renderSpinner(): Children {
		return m(".text-center", lang.get("pleaseWait_msg"))
	}

	private renderTransferPrompt(): Children {
		const savedCredentials = this.viewModel.logins.getSavedCredentials()
		if (savedCredentials.length === 0) {
			this.viewModel.executeMigration()
			return this.renderSpinner()
		} else {
			return [
				lang.get("transferCredentials_msg"),
				m(Table, {
					columnHeading: ["knownCredentials_label"],
					showActionButtonColumn: false,
					columnWidths: [ColumnWidth.Largest],
					lines: savedCredentials.map((c) => ({ cells: [c.login] })),
					class: " mt mb",
				} satisfies TableAttrs),
				m(LoginButton, {
					label: "apply_action",
					onclick: () => this.viewModel.executeMigration(),
				}),
			]
		}
	}

	private renderCompleteMessage(): Children {
		return m(".text-center", [
			m(".mb", lang.get("credentialMigrationDone_msg")),
			m(LoginButton, {
				label: "close_alt",
				onclick: () => window.close(),
			}),
		])
	}
}
