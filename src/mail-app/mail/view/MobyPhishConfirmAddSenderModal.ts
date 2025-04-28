import m, { Children } from "mithril"
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js"
import { Keys } from "../../../common/api/common/TutanotaConstants.js"
import type { Shortcut } from "../../../common/misc/KeyManager.js"
import { MailViewerViewModel, TRUSTED_SENDERS_API_URL } from "./MailViewerViewModel.js"

// Helper function to format sender
function formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
	const trimmedName = name?.trim()
	const validAddress = address?.trim() || ""
	if (!validAddress) return "Sender Info Unavailable"
	if (trimmedName && trimmedName !== validAddress) return `${trimmedName} (${validAddress})`
	return validAddress
}

export class MobyPhishConfirmAddSenderModal implements ModalComponent {
	private modalHandle?: ModalComponent
	private viewModel: MailViewerViewModel
	private senderDisplay: string
	private senderAddress: string
	private senderName: string
	private isLoading: boolean = false
	private errorMessage: string | null = null

	constructor(viewModel: MailViewerViewModel) {
		this.viewModel = viewModel

		const address = this.viewModel.mail.sender.address
		const name = this.viewModel.mail.sender.name || ""
		this.senderAddress = address
		this.senderName = name
		this.senderDisplay = formatSenderDisplay(name, address)
	}

	view(): Children {
		return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
			m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
				m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
					m(
						"p",
						{
							style: {
								fontSize: "16px",
								fontWeight: "bold",
								textAlign: "center",
								marginBottom: "15px",
							},
						},
						"Add to Trusted Senders?",
					),
					m(
						"p",
						{
							style: {
								fontSize: "14px",
								textAlign: "center",
								marginBottom: "20px",
							},
						},
						["Are you sure you want to add ", m("strong", this.senderDisplay), " to your trusted senders list?"],
					),

					this.errorMessage
						? m(
								".error-message",
								{
									style: {
										color: "red",
										fontSize: "12px",
										marginTop: "5px",
										marginBottom: "10px",
									},
								},
								this.errorMessage,
						  )
						: null,

					// Confirm Button
					m(
						"button",
						{
							onclick: () => this.confirmAddSender(),
							disabled: this.isLoading,
							style: this.getConfirmButtonStyle(this.isLoading),
						},
						this.isLoading ? "Adding..." : "Confirm Add",
					),

					// Cancel Button
					m(
						"button",
						{
							onclick: () => this.closeModal(),
							disabled: this.isLoading,
							style: this.getCancelButtonStyle(),
						},
						"Cancel",
					),
				]),
			]),
		])
	}

	private async confirmAddSender(): Promise<void> {
		if (this.isLoading) return
		this.isLoading = true
		this.errorMessage = null
		m.redraw()

		const userEmail = this.viewModel.logins.getUserController().loginUsername

		try {
			const response = await fetch(`${TRUSTED_SENDERS_API_URL}/add-trusted`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					user_email: userEmail,
					trusted_email: this.senderAddress,
					trusted_name: this.senderName,
				}),
				credentials: "include", // Include cookies for cross-origin requests
				mode: "cors", // Explicitly request CORS mode
			})

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.message || `Failed to add sender (${response.status})`)
			}

			this.closeModal()
			await this.viewModel.updateSenderStatus("confirmed")
		} catch (error: any) {
			console.error("Error adding sender via confirmation modal:", error)
			this.errorMessage = error.message || "An error occurred while adding the sender."
			this.isLoading = false
			m.redraw()
		}
	}

	private closeModal() {
		if (this.modalHandle) {
			modal.remove(this.modalHandle)
		}
	}

	private getConfirmButtonStyle(disabled: boolean) {
		const defaultColor = "#850122"
		const hoverOpacity = 0.7

		const baseStyle: any = {
			background: disabled ? "#cccccc" : defaultColor,
			color: disabled ? "#666666" : "#ffffff",
			border: "none",
			padding: "12px",
			borderRadius: "8px",
			cursor: disabled ? "not-allowed" : "pointer",
			width: "100%",
			fontSize: "14px",
			fontWeight: "bold",
			textAlign: "center",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			transition: "opacity 0.2s ease",
			opacity: disabled ? 0.6 : 1,
			marginTop: "10px",
		}

		if (!disabled) {
			baseStyle.onmouseover = (e: MouseEvent) => ((e.target as HTMLElement).style.opacity = hoverOpacity.toString())
			baseStyle.onmouseout = (e: MouseEvent) => ((e.target as HTMLElement).style.opacity = "1")
		}

		return baseStyle
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
			onmouseover: (e: MouseEvent) => ((e.target as HTMLElement).style.backgroundColor = "#f2f2f2"),
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
			maxWidth: "400px",
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
		if (!this.isLoading) this.closeModal()
	}

	popState(): boolean {
		if (!this.isLoading) this.closeModal()
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
						this.closeModal()
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
