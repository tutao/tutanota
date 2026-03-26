import m, { Children } from "mithril"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { AddImapImportData, ImapImportModel, ImapImportModelConfig, showAddImapImportWizard } from "./AddImapImportWizard.js"
import { ImapImportState, ImportState } from "../../../api/worker/imapimport/ImapImportState.js"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { ImportImapAccount, ImportImapAccountSyncStateTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"
import { theme } from "../../../common/gui/theme"
import { px } from "../../../common/gui/size"
import { formatDateTime } from "../../../common/misc/Formatter"
import { locator } from "../../workerUtils/worker/WorkerLocator"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"

assertMainOrNode()

class ImapImportSettingsViewer implements UpdatableSettingsViewer {
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
				this.imapImportState().state !== ImportState.NOT_INITIALIZED ? this.renderImapImportStatusCard() : null,
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
					icon: Icons.PenFilled,
					size: ButtonSize.Compact,
				}),
			]),
		]
	}

	private renderImapImportStatusCard(): Children {
		const continueImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "continueImapImport_action",
			icon: Icons.PlayFilled,
			click: () => this.continueImapImport(),
			size: ButtonSize.Normal,
		}

		const pauseImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "pauseImapImport_action",
			icon: Icons.PauseFilled,
			click: () => this.pauseImapImport(),
			size: ButtonSize.Normal,
		}

		return m(
			".border-radius-big",
			{
				style: {
					border: `1px solid ${theme.content_accent_tuta_bday}`,
					backgroundColor: theme.surface_container,
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
					this.imapImportState().state !== ImportState.RUNNING ? m(IconButton, continueImapImportIconButtonAttrs) : null,
					this.imapImportState().state === ImportState.RUNNING ? m(IconButton, pauseImapImportIconButtonAttrs) : null,
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
		let imapImporter = await locator.imapImporter()
		let newImapImportState = await imapImporter.continueImport()
		this.imapImportState(newImapImportState)
	}

	private async pauseImapImport() {
		let imapImporter = await locator.imapImporter()
		let newImapImportState = await imapImporter.pauseImport()
		this.imapImportState(newImapImportState)
	}

	private async requestImapImportAccountSyncState() {
		let imapImporter = await locator.imapImporter()
		const importImapAccountSyncState = await imapImporter.loadImportImapAccountSyncState()
		const rootImportMailFolder = await imapImporter.loadRootImportFolder()

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
		let imapImporter = await locator.imapImporter()
		let newImapImportState = imapImporter.loadImapImportState()
		this.imapImportState(newImapImportState)

		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImportImapAccountSyncStateTypeRef, update)) {
				this.requestImapImportAccountSyncState()
				this.updateImapImportState()
			}
		}
	}
}

export default ImapImportSettingsViewer
