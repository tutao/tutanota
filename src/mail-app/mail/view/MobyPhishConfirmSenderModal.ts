import { Icon } from "../../../common/gui/base/Icon.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import m, { Children } from "mithril"
import { Keys, MailSetKind } from "../../../common/api/common/TutanotaConstants.js"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import type { Shortcut } from "../../../common/misc/KeyManager.js"
import { MailViewerViewModel, TRUSTED_SENDERS_API_URL, TrustedSenderInfo } from "./MailViewerViewModel.js"
import { moveMails } from "./MailGuiUtils.js"
import { assertSystemFolderOfType } from "../model/MailUtils.js"

// Inject primary button style only once
const styleId = "moby-phish-hover-style"
if (!document.getElementById(styleId)) {
	const style = document.createElement("style")
	style.id = styleId
	style.textContent = `
        .mobyphish-btn {
            background: #850122;
            color: #ffffff;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s ease;
            margin-top: 10px;
            opacity: 1;
        }

        .mobyphish-btn:hover {
            opacity: 0.7;
        }
    `
	document.head.appendChild(style)
}

// Inject outline button style only once
const outlineStyleId = "moby-phish-outline-style"
if (!document.getElementById(outlineStyleId)) {
	const style = document.createElement("style")
	style.id = outlineStyleId
	style.textContent = `
        .mobyphish-outline-btn {
            background: transparent;
            color: #850122;
            border: 1px solid #850122;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            font-weight: normal;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s ease;
            margin-top: 10px;
            opacity: 1;
        }

        .mobyphish-outline-btn:hover {
            opacity: 0.7;
        }
    `
	document.head.appendChild(style)
}

export class MobyPhishConfirmSenderModal implements ModalComponent {
	private viewModel: MailViewerViewModel
	private modalHandle?: ModalComponent
	private selectedSenderEmail: string = ""
	private trustedSenderObjects: TrustedSenderInfo[]
	private modalState: "initial" | "warning" = "initial"
	private isLoading: boolean = false
	private errorMessage: string | null = null
	private skippedInitialView: boolean = false

	constructor(viewModel: MailViewerViewModel, trustedSenders: TrustedSenderInfo[]) {
		this.viewModel = viewModel
		this.trustedSenderObjects = Array.isArray(trustedSenders) ? trustedSenders.filter((s) => s && typeof s.address === "string") : []

		if (this.trustedSenderObjects.length === 0) {
			this.modalState = "warning"
			this.selectedSenderEmail = this.viewModel.getSender().address || ""
			this.skippedInitialView = true
		}
	}

	private formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
		const trimmedName = name?.trim()
		const validAddress = address?.trim() || ""
		if (!validAddress) return trimmedName || "Sender Info Unavailable"
		if (trimmedName && trimmedName !== validAddress) return `${trimmedName} (${validAddress})`
		return validAddress
	}

	view(): Children {
		return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
			m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
				m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
					this.modalState === "initial" ? this.renderInitialView() : this.renderWarningView(),
				]),
			]),
		])
	}

	private renderInitialView(): Children {
		const isConfirmDisabled = !this.selectedSenderEmail.trim() || this.isLoading

		return [
			m(
				"p",
				{ style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px", color: "black" } },
				"Who do you believe this email is from?",
			),
			m("input[type=text]", {
				placeholder: "Search or type sender email or name...",
				value: this.selectedSenderEmail,
				oninput: (e: Event) => {
					this.selectedSenderEmail = (e.target as HTMLInputElement).value
					this.errorMessage = null
				},
				list: "trusted-senders-list",
				style: {
					padding: "10px",
					width: "100%",
					boxSizing: "border-box",
					borderRadius: "8px",
					border: "1px solid #ccc",
					color: "black",
				},
				required: true,
			}),
			m(
				"datalist#trusted-senders-list",
				this.trustedSenderObjects.map((sender) => m("option", { value: sender.address }, this.formatSenderDisplay(sender.name, sender.address))),
			),
			this.errorMessage
				? m(
						".error-message",
						{
							style: { color: "red", fontSize: "12px", marginTop: "5px" },
						},
						this.errorMessage,
				  )
				: null,

			m(
				"button",
				{
					onclick: async () => {
						if (isConfirmDisabled) return
						console.log(
							`🔒 MOBYPHISH_LOG: Confirm button clicked in initial modal, selectedSender="${this.selectedSenderEmail}", actualSender="${
								this.viewModel.getSender().address
							}"`,
						)

						this.isLoading = true
						this.errorMessage = null
						m.redraw()

						const enteredEmail = this.selectedSenderEmail.trim().toLowerCase()
						const actualEmail = this.viewModel.getSender().address?.trim().toLowerCase()

						if (enteredEmail === actualEmail) {
							try {
								await this.viewModel.updateSenderStatus("confirmed")
								modal.remove(this.modalHandle!)
							} catch (err) {
								console.error(err)
								this.errorMessage = "Failed to update status. Please try again."
								this.isLoading = false
								m.redraw()
							}
						} else {
							console.log(`🔒 MOBYPHISH_LOG: Email mismatch detected, showing warning view`)
							this.modalState = "warning"
							this.isLoading = false
							m.redraw()
						}
					},
					disabled: isConfirmDisabled,
					style: { ...this.getCancelButtonStyle(), color: "black" },
				},
				"Confirm",
			),

			m(
				"button",
				{
					onclick: () => modal.remove(this.modalHandle!),
					disabled: this.isLoading,
					style: { ...this.getCancelButtonStyle(), color: "black" },
				},
				"Cancel",
			),
		]
	}

	private renderWarningView(): Children {
		const actual = this.viewModel.getDisplayedSender()
		const address = this.viewModel.getSender().address
		const actualDisplay = this.formatSenderDisplay(actual?.name, address)
		const canAddSender = !!address

		let warningText = this.skippedInitialView ? "This sender is not on your trusted list:" : "You indicated this email might be from:"
		const displaySender = this.skippedInitialView
			? actualDisplay
			: this.formatSenderDisplay(
					this.trustedSenderObjects.find((s) => s.address.toLowerCase() === this.selectedSenderEmail.trim().toLowerCase())?.name,
					this.selectedSenderEmail,
			  )

		return [
			m(
				"p",
				{
					style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "5px", color: "black" },
				},
				m(Icon, {
					icon: Icons.Warning,
					style: { fill: "#FFA500", marginRight: "8px", verticalAlign: "middle" },
				}),
				"Potential Phishing Attempt",
			),

			m(
				"p",
				{
					style: { fontSize: "14px", textAlign: "center", marginBottom: "15px", color: "black" },
				},
				[
					warningText,
					m("br"),
					m("strong", displaySender),
					!this.skippedInitialView ? m("br") : null,
					!this.skippedInitialView ? `However, the actual sender is different or not already in your trusted senders list.` : null,
				],
			),

			!this.skippedInitialView
				? m(
						"p",
						{
							style: {
								fontSize: "12px",
								textAlign: "center",
								marginBottom: "20px",
								fontStyle: "italic",
								color: "black",
							},
						},
						`(Actual sender: ${actualDisplay})`,
				  )
				: null,

			this.errorMessage
				? m(
						".error-message",
						{
							style: { color: "red", fontSize: "12px", marginBottom: "10px" },
						},
						this.errorMessage,
				  )
				: null,

			// Report as Phishing (Primary)
			m(
				"button.mobyphish-btn",
				{
					onclick: async () => {
						console.log(`🔒 MOBYPHISH_LOG: "Report as Phishing" button clicked for sender="${this.viewModel.getSender().address}"`)

						const senderEmail = this.viewModel.getSender().address
						const userEmail = this.viewModel.logins.getUserController().loginUsername

						try {
							// Update MobyPhish API
							const response = await fetch(`${TRUSTED_SENDERS_API_URL}/update-email-status`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									user_email: userEmail,
									email_id: this.viewModel.mail._id[1],
									sender_email: senderEmail,
									status: "reported_phishing",
									interaction_type: "interacted",
								}),
							})

							if (response.ok) {
								console.log(`🔒 MOBYPHISH_LOG: Successfully updated MobyPhish API for sender="${senderEmail}"`)

								// Move email to spam folder (without reporting to Tutanota servers)
								try {
									const mailboxDetail = await this.viewModel.mailModel.getMailboxDetailsForMail(this.viewModel.mail)
									if (mailboxDetail && mailboxDetail.mailbox.folders) {
										const folders = await this.viewModel.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
										const spamFolder = assertSystemFolderOfType(folders, MailSetKind.SPAM)

										await moveMails({
											mailboxModel: this.viewModel.mailboxModel,
											mailModel: this.viewModel.mailModel,
											mails: [this.viewModel.mail],
											targetMailFolder: spamFolder,
											isReportable: false,
										})
										console.log(`🔒 MOBYPHISH_LOG: Successfully moved email to spam folder for sender="${senderEmail}"`)
									}
								} catch (moveError) {
									console.error(`🔒 MOBYPHISH_LOG: Failed to move email to spam folder for sender="${senderEmail}":`, moveError)
								}

								await this.viewModel.fetchSenderData()
								if (this.modalHandle) {
									modal.remove(this.modalHandle)
								} else {
									console.warn("No modal handle set")
								}
								m.redraw()
							} else {
								console.error("🔒 MOBYPHISH_LOG: Failed to update MobyPhish API")
							}
						} catch (error) {
							console.error("🔒 MOBYPHISH_LOG: Error updating MobyPhish API:", error)
						}
					},
					disabled: this.isLoading,
				},
				"Report as Phishing",
			),

			// Add to Trusted List (Outlined, NOT bold)
			m(
				"button.mobyphish-outline-btn",
				{
					onclick: async () => {
						console.log(`🔒 MOBYPHISH_LOG: "Add to Trusted List" button clicked for sender="${this.viewModel.getSender().address}"`)

						if (this.isLoading || !canAddSender) return
						this.isLoading = true
						this.errorMessage = null
						m.redraw()

						try {
							const response = await fetch(`${TRUSTED_SENDERS_API_URL}/add-trusted`, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									user_email: this.viewModel.logins.getUserController().loginUsername,
									trusted_email: address,
									trusted_name: actual?.name || "",
								}),
							})
							if (!response.ok) throw new Error("Failed to add sender.")

							console.log(`🔒 MOBYPHISH_LOG: Successfully added sender="${address}" to trusted list`)
							await this.viewModel.updateSenderStatus("confirmed")
							modal.remove(this.modalHandle!)
						} catch (err: any) {
							console.error(`🔒 MOBYPHISH_LOG: Error adding sender to trusted list:`, err)
							this.errorMessage = err.message || "Error occurred while adding."
							this.isLoading = false
							m.redraw()
						}
					},
					disabled: this.isLoading || !canAddSender,
				},
				`Add ${this.viewModel.getSender().address} to Trusted List`,
			),

			// Cancel
			m(
				"button",
				{
					onclick: () => {
						if (!this.isLoading) modal.remove(this.modalHandle!)
					},
					disabled: this.isLoading,
					style: this.getCancelButtonStyle(),
				},
				"Cancel",
			),
		]
	}

	private getCancelButtonStyle() {
		return {
			background: "transparent",
			color: "#555",
			border: "1px solid #ccc",
			padding: "12px",
			borderRadius: "8px",
			cursor: "pointer",
			width: "100%",
			fontSize: "14px",
			fontWeight: "normal",
			textAlign: "center",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginTop: "10px",
			transition: "background-color 0.2s ease",
			onmouseover: (e: MouseEvent) => ((e.target as HTMLElement).style.backgroundColor = "#f0f0f0"),
			onmouseout: (e: MouseEvent) => ((e.target as HTMLElement).style.backgroundColor = "transparent"),
		}
	}

	private getModalStyle() {
		return {
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			padding: "25px",
			textAlign: "center",
			background: "#fff",
			boxShadow: "0px 5px 15px rgba(0,0,0,0.25)",
			borderRadius: "10px",
			width: "90%",
			maxWidth: "420px",
			display: "flex",
			flexDirection: "column",
			gap: "0px",
		}
	}

	hideAnimation(): Promise<void> {
		return Promise.resolve()
	}
	onClose(): void {}
	backgroundClick(e: MouseEvent): void {
		if (!this.isLoading) modal.remove(this.modalHandle!)
	}
	popState(): boolean {
		if (!this.isLoading) modal.remove(this.modalHandle!)
		return false
	}
	callingElement(): HTMLElement | null {
		return null
	}
	shortcuts(): Shortcut[] {
		return [
			{
				key: Keys.ESC,
				exec: () => {
					if (!this.isLoading) {
						modal.remove(this.modalHandle!)
						return true
					}
					return false
				},
				help: "close_alt",
			},
		]
	}
	setModalHandle(handle: ModalComponent) {
		this.modalHandle = handle
	}
}
