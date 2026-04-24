import m, { Children } from "mithril"
import { ImapImportModel, ImapImportModelConfig, showAddImapImportWizard } from "./AddImapImportWizard.js"
import { assertMainOrNode } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../../common/settings/Interfaces"
import { entityUpdateUtils, tutanotaTypeRefs } from "@tutao/typerefs"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel"
import { IconButton, IconButtonAttrs } from "../../../common/gui/base/IconButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { ButtonSize } from "../../../common/gui/base/ButtonSize"
import { theme } from "../../../common/gui/theme"
import { px } from "../../../common/gui/size"
import { formatDateTime } from "../../../common/misc/Formatter"
import { ImapImportState, ImportState } from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapImporter } from "../../workerUtils/imapimport/ImapImporter"
import { lazy } from "@tutao/utils"

assertMainOrNode()

class ImapImportSettingsViewer implements UpdatableSettingsViewer {
	private importImapAccount: tutanotaTypeRefs.ImportImapAccount | null = null
	private rootImportMailFolderName: string = ""
	private imapAccountHost: string
	private imapAccountPort: number
	private imapAccountUsername: string
	private stars: string
	private imapImportState: ImapImportState
	private matchImportFoldersToTutanotaFolders: boolean

	constructor(private readonly imapImporter: lazy<ImapImporter>) {
		this.imapAccountHost = ""
		this.imapAccountPort = 0
		this.imapAccountUsername = ""
		this.stars = ""
		this.matchImportFoldersToTutanotaFolders = false
		this.imapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
	}

	async oninit() {
		await this.requestImapImportAccountSyncState()
		await this.updateImapImportState()
	}

	view(): Children {
		const imapAccountHostAttrs: TextFieldAttrs = {
			label: "imapAccountHost_label",
			value: this.imapAccountHost,
			oninput: (value) => (this.imapAccountHost = value),
			disabled: true,
		}
		const imapAccountPortAttrs: TextFieldAttrs = {
			label: "imapAccountPort_label",
			value: this.imapAccountPort.toString(),
			oninput: (value) => (this.imapAccountPort = Number.parseInt(value)),
			disabled: true,
		}
		const imapAccountUsernameAttrs: TextFieldAttrs = {
			label: "imapAccountUsername_label",
			value: this.imapAccountUsername,
			oninput: (value) => (this.imapAccountUsername = value),
			disabled: true,
		}
		const imapAccountPasswordAttrs: TextFieldAttrs = {
			label: "imapAccountPassword_label",
			value: this.stars,
			oninput: (value) => (this.stars = value),
			disabled: true,
		}

		return [
			m("#user-settings.fill-absolute.scroll.plr-24.pb-48", [
				this.renderImapImportSettingsLabel(),
				m(TextField, imapAccountHostAttrs),
				m(TextField, imapAccountPortAttrs),
				m(TextField, imapAccountUsernameAttrs),
				m(TextField, imapAccountPasswordAttrs),
				this.renderImapImportStatusCard(),
			]),
		]
	}

	private renderImapImportSettingsLabel(): Children {
		const imapImportModel = this.getImapImportModel()

		return [
			m(".flex-space-between.items-center.mt-32", [
				m(".h4", lang.get("mailImportSettings_label")),
				m(IconButton, {
					title: "setUpImapImport_label",
					click: () => showAddImapImportWizard(this.imapImporter(), imapImportModel).then(() => m.redraw()),
					icon: Icons.PenFilled,
					size: ButtonSize.Compact,
				}),
			]),
		]
	}

	private getImapImportModel() {
		// FIXME:Delete these default credentials
		const state = this.imapImportState.state
		const imapImportModelConfig: ImapImportModelConfig = {
			imapAccountHost: this.importImapAccount?.host ?? "localhost",
			imapAccountPort: Number.parseInt(this.importImapAccount?.port ?? "143"),
			imapAccountUsername: this.importImapAccount?.userName ?? "user@test.com",
			imapAccountPassword: this.importImapAccount?.password ?? "password",
			rootImportMailFolderName: this.rootImportMailFolderName ?? "",
			matchImportFoldersToTutanotaFolders: this.matchImportFoldersToTutanotaFolders,
			isModifyingExistingImport: false,
		}

		return new ImapImportModel(imapImportModelConfig)
	}

	private renderImapImportStatusCard(): Children {
		const imapImportModel = this.getImapImportModel()
		const setUpImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "setUpImapImport_label",
			click: () => showAddImapImportWizard(this.imapImporter(), imapImportModel).then(() => m.redraw()),
			icon: Icons.PenFilled,
			size: ButtonSize.Normal,
		}

		const modifyImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "modifyImapImport_label",
			click: () => {
				imapImportModel.isModifyingExistingImport = true
				showAddImapImportWizard(this.imapImporter(), imapImportModel).then(() => m.redraw())
			},
			icon: Icons.PenFilled,
			size: ButtonSize.Normal,
		}

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

		const deleteImapImportIconButtonAttrs: IconButtonAttrs = {
			title: "deleteImapImport_action",
			icon: Icons.X,
			click: () => this.deleteImapImport(),
			size: ButtonSize.Normal,
		}
		const state = this.imapImportState.state
		return m(
			".border-radius-16",
			{
				style: {
					border: `1px solid ${theme.content_accent_tuta_bday}`,
					backgroundColor: theme.surface_container,
					marginTop: px(48),
					padding: px(16),
				},
			},
			[
				m("center.mb-8.text-center", [
					m(
						".h4.b.teamLabel.pl-8.pr-8.border-radius-16.mb-8",
						lang.get(this.getReadableImapImportStatus(), {
							"{postponedUntil}": formatDateTime(this.imapImportState.postponedUntil),
						}),
					),
				]),
				m("center", [
					state === ImportState.NOT_INITIALIZED ? m(IconButton, setUpImapImportIconButtonAttrs) : null,
					state === ImportState.PAUSED ? m(IconButton, continueImapImportIconButtonAttrs) : null,
					state === ImportState.RUNNING || state === ImportState.POSTPONED || state === ImportState.PAUSED
						? m(IconButton, modifyImapImportIconButtonAttrs)
						: null,
					state === ImportState.RUNNING || state === ImportState.POSTPONED ? m(IconButton, pauseImapImportIconButtonAttrs) : null,
					state !== ImportState.NOT_INITIALIZED ? m(IconButton, deleteImapImportIconButtonAttrs) : null,
				]),
			],
		)
	}

	private getReadableImapImportStatus(): TranslationKey {
		switch (this.imapImportState.state) {
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
		const continueImportResult = await this.imapImporter().continueImport()
		if (continueImportResult.error) {
			console.error("On trying to continue an import failed!", continueImportResult.error)
		} else if (continueImportResult.state) {
			this.imapImportState = continueImportResult.state
		}
		//this.imapImportState
		m.redraw()
	}

	private async pauseImapImport() {
		this.imapImportState = await this.imapImporter().pauseImport()
		m.redraw()
	}

	private async deleteImapImport() {
		let isDeleteSuccessful = await this.imapImporter().deleteImport()
		if (isDeleteSuccessful) {
			this.imapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
		}
		m.redraw()
	}

	private async requestImapImportAccountSyncState() {
		const importImapAccountSyncState = await this.imapImporter().loadImportImapAccountSyncState()
		const rootImportMailFolder = await this.imapImporter().loadRootImportFolder()

		this.importImapAccount = importImapAccountSyncState?.imapAccount ?? null
		this.rootImportMailFolderName = rootImportMailFolder?.name ?? ""

		this.imapAccountHost = this.importImapAccount?.host ?? ""
		this.imapAccountPort = Number.parseInt(this.importImapAccount?.port ?? "")
		this.imapAccountUsername = this.importImapAccount?.userName ?? ""
		this.stars = this.importImapAccount?.password ? "***" : ""
		this.matchImportFoldersToTutanotaFolders = rootImportMailFolder == null
		m.redraw()
	}

	private async updateImapImportState() {
		this.imapImportState = await this.imapImporter().loadImapImportState()
		m.redraw()
	}

	async entityEventsReceived(updates: ReadonlyArray<entityUpdateUtils.EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (entityUpdateUtils.isUpdateForTypeRef(tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef, update)) {
				await this.requestImapImportAccountSyncState()
				await this.updateImapImportState()

				m.redraw()
			}
		}
	}
}

export default ImapImportSettingsViewer
