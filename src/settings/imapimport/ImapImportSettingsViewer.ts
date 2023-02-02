import m, { Children } from "mithril"
import { assertMainOrNode } from "../../api/common/Env.js"
import { UpdatableSettingsViewer } from "../SettingsView.js"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { TextField, TextFieldAttrs } from "../../gui/base/TextField.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { lang, TranslationKey } from "../../misc/LanguageViewModel.js"
import { locator } from "../../api/main/MainLocator.js"
import { ImportImapAccount, ImportImapAccountSyncStateTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/main/EventController.js"
import { AddImapImportData, ImapImportModel, ImapImportModelConfig, showAddImapImportWizard } from "./AddImapImportWizard.js"
import { theme } from "../../gui/theme.js"
import { px } from "../../gui/size.js"
import { ImapImportState, ImportState } from "../../api/worker/imapimport/ImapImportState.js"
import { formatDateTime } from "../../misc/Formatter.js"

assertMainOrNode()

export class ImapImportSettingsViewer implements UpdatableSettingsViewer {
	private importImapAccount: ImportImapAccount | null = null
	private rootImportMailFolderName: string = ""
	private imapAccountHost: Stream<string>
	private imapAccountPort: Stream<string>
	private imapAccountUsername: Stream<string>
	private stars: Stream<string>
	private importedMailCount: stream<string>
	private imapImportState: stream<ImapImportState>

	constructor() {
		this.imapAccountHost = stream<string>("")
		this.imapAccountPort = stream<string>("")
		this.imapAccountUsername = stream<string>("")
		this.stars = stream<string>("")

		this.importedMailCount = stream<string>("0")
		this.importedMailCount.map(m.redraw)

		this.imapImportState = stream(new ImapImportState(ImportState.NOT_INITIALIZED))
		this.imapImportState.map(m.redraw)
	}

	oninit() {
		this.requestImapImportAccountSyncState()
		this.updateImapImportState()
	}

	view(): Children {
		const imapAccountHostAttrs: TextFieldAttrs = {
			label: "imapAccountHost_label",
			value: this.imapAccountHost(),
			oninput: this.imapAccountHost,
			disabled: true,
		}
		const imapAccountPortAttrs: TextFieldAttrs = {
			label: "imapAccountPort_label",
			value: this.imapAccountPort(),
			oninput: this.imapAccountPort,
			disabled: true,
		}
		const imapAccountUsernameAttrs: TextFieldAttrs = {
			label: "imapAccountUsername_label",
			value: this.imapAccountUsername(),
			oninput: this.imapAccountUsername,
			disabled: true,
		}
		const imapAccountPasswordAttrs: TextFieldAttrs = {
			label: "imapAccountPassword_label",
			value: this.stars(),
			oninput: this.stars,
			disabled: true,
		}

		return [
			m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
				this.renderImapImportSettingsLabel(),
				m(TextField, imapAccountHostAttrs),
				m(TextField, imapAccountPortAttrs),
				m(TextField, imapAccountUsernameAttrs),
				m(TextField, imapAccountPasswordAttrs),
				this.imapImportState().state != ImportState.NOT_INITIALIZED ? this.renderImapImportStatusCard() : null,
			]),
		]
	}

	private renderImapImportSettingsLabel(): Children {
		const imapImportModelConfig: ImapImportModelConfig = {
			imapAccountHost: this.importImapAccount?.host ?? "",
			imapAccountPort: this.importImapAccount?.port ?? "",
			imapAccountUsername: this.importImapAccount?.userName ?? "",
			imapAccountPassword: this.importImapAccount?.password ?? "",
			rootImportMailFolderName: this.rootImportMailFolderName ?? "",
		}

		const model = new ImapImportModel(imapImportModelConfig)

		const addImapImportData: AddImapImportData = {
			model: model,
		}

		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("imapImportSettings_label")),
				m(IconButton, {
					title: "setUpImapImport_label",
					click: () => showAddImapImportWizard(addImapImportData),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				}),
			]),
		]
	}

	private renderImapImportStatusCard(): Children {
		const continueImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "continueImapImport_action",
			icon: Icons.Play,
			click: () => this.continueImapImport(),
			size: ButtonSize.Normal,
		}

		const pauseImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseImapImport_action",
			icon: Icons.Pause,
			click: () => this.pauseImapImport(),
			size: ButtonSize.Normal,
		}

		return m(
			".border-radius-big",
			{
				style: {
					border: `1px solid ${theme.content_accent}`,
					backgroundColor: theme.content_bg,
					marginTop: px(48),
					padding: px(16),
				},
			},
			[
				m("center.mb-s.text-center", [
					m(
						".h4.b.teamLabel.pl-s.pr-s.border-radius-big.mb-s",
						lang.get(this.getReadableImapImportStatus(), {
							"{postponedUntil}": formatDateTime(this.imapImportState().postponedUntil),
						}),
					),
					m(
						".h5",
						lang.get("imapImportStatusImportedMailCount_label", {
							"{importedMailCount}": this.importedMailCount(),
						}),
					),
				]),
				m("center", [
					this.imapImportState().state != ImportState.RUNNING ? m(IconButton, continueImapImportIconButtonAttrs) : null,
					this.imapImportState().state == ImportState.RUNNING ? m(IconButton, pauseImapImportIconButtonAttrs) : null,
				]),
			],
		)
	}

	private getReadableImapImportStatus(): TranslationKey {
		switch (this.imapImportState().state) {
			case ImportState.NOT_INITIALIZED:
				return "imapImportStatusNotInitialized_label"
			case ImportState.PAUSED:
				return "imapImportStatusPaused_label"
			case ImportState.RUNNING:
				return "imapImportStatusRunning_label"
			case ImportState.POSTPONED:
				return "imapImportStatusPostponed_label"
			case ImportState.FINISHED:
				return "imapImportStatusFinished_label"
		}
	}

	private async continueImapImport() {
		let newImapImportState = await locator.imapImporterFacade.continueImport()
		this.imapImportState(newImapImportState)
	}

	private async pauseImapImport() {
		let newImapImportState = await locator.imapImporterFacade.pauseImport()
		this.imapImportState(newImapImportState)
	}

	private async requestImapImportAccountSyncState() {
		const importImapAccountSyncState = await locator.imapImporterFacade.loadImportImapAccountSyncState()
		const rootImportMailFolder = await locator.imapImporterFacade.loadRootImportFolder()

		this.importImapAccount = importImapAccountSyncState?.imapAccount ?? null
		this.rootImportMailFolderName = rootImportMailFolder?.name ?? ""

		this.imapAccountHost(this.importImapAccount?.host ?? "")
		this.imapAccountPort(this.importImapAccount?.port ?? "")
		this.imapAccountUsername(this.importImapAccount?.userName ?? "")
		this.stars(this.importImapAccount?.password ? "***" : "")
		this.importedMailCount(importImapAccountSyncState?.importedMailCount ?? "0")

		m.redraw()
	}

	private async updateImapImportState() {
		let newImapImportState = await locator.imapImporterFacade.loadImapImportState()
		this.imapImportState(newImapImportState)

		m.redraw()
	}

	// TODO we should maybe track the importState on the server to allow the UI to be updated.
	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportImapAccountSyncStateTypeRef, update)) {
				this.requestImapImportAccountSyncState()
				this.updateImapImportState()
			}
		}
	}
}
