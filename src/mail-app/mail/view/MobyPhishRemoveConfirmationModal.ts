// src/mail-app/mail/view/MobyPhishRemoveConfirmationModal.ts

import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js"; // Import ContentBlockingStatus
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import { MailViewerViewModel, API_BASE_URL, ContentBlockingStatus } from "./MailViewerViewModel.js"; // Import ViewModel and API URL

// Helper function for consistent display
function formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
    const trimmedName = name?.trim();
    const validAddress = address?.trim() || '';
    if (!validAddress) return "Sender Info Unavailable";
    if (trimmedName && trimmedName !== validAddress) return `${trimmedName} (${validAddress})`;
    return validAddress;
}

export class MobyPhishRemoveConfirmationModal implements ModalComponent {
    private modalHandle?: ModalComponent;
    private viewModel: MailViewerViewModel;
    private senderDisplay: string;
    private senderAddress: string;
    private isLoading: boolean = false;
    private errorMessage: string | null = null;

    constructor(viewModel: MailViewerViewModel) {
        this.viewModel = viewModel;

        // Get sender info directly from the mail object
        const address = this.viewModel.mail.sender.address;
        const name = this.viewModel.mail.sender.name || '';
        this.senderAddress = address;
        this.senderDisplay = formatSenderDisplay(name, address);
    }

    view(): Children {
        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    // Title
                    m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" } },
                        "Remove from Trusted Senders?"
                    ),
                    // Confirmation Message
                    m("p", { style: { fontSize: "14px", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" } }, [
                        "Are you sure you want to remove ",
                        m("strong", this.senderDisplay), // Display formatted name/address
                        " from your trusted senders list?",
                    ]),

                    this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px', marginBottom: '10px' } }, this.errorMessage) : null,

                    // Confirm Remove Button
                    m("button.btn.btn-danger", { // Use danger style for remove confirmation
                        onclick: () => this.confirmRemoveSender(),
                        disabled: this.isLoading,
                        style: this.getButtonStyle("#DC3545", "#C82333", this.isLoading) // Red button
                    }, this.isLoading ? "Removing..." : "Confirm Remove"),

                    // Cancel Button
                    m("button.btn", {
                        onclick: () => this.closeModal(),
                        disabled: this.isLoading,
                        style: this.getCancelButtonStyle()
                    }, "Cancel")
                ])
            ])
        ]);
    }

    private async confirmRemoveSender(): Promise<void> {
        if (this.isLoading) return;
        this.isLoading = true;
        this.errorMessage = null;
        m.redraw();

        const userEmail = this.viewModel.logins.getUserController().loginUsername;

        console.log(`Remove Confirmation Modal: Removing User=${userEmail}, Email=${this.senderAddress}`);

        try {
            const response = await fetch(`${API_BASE_URL}/remove-trusted`, { // Use the correct endpoint
                method: "POST", // Or DELETE if your API uses that
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_email: userEmail,
                    trusted_email: this.senderAddress, // Only need email to remove
                })
            });

            if (!response.ok) {
                // Handle specific case where sender wasn't found (404) vs other errors
                if (response.status === 404) {
                   throw new Error("Sender was not found in the trusted list.");
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to remove sender (${response.status})`);
            }

            console.log(`Sender "${this.senderAddress}" removed from trusted list via confirmation modal.`);

            // Close this modal *before* refreshing state
            this.closeModal();

            // Refresh the trusted senders list in the ViewModel
            await this.viewModel.fetchSenderData();

            // Reset the state for the current email in the ViewModel
            this.viewModel.senderStatus = ""; // Clear specific status
            this.viewModel.setSenderConfirmed(false); // Mark as not confirmed
            // Explicitly set content blocking back to Block
            await this.viewModel.setContentBlockingStatus(ContentBlockingStatus.Block);

            // No need to call updateSenderStatus, just trigger redraw after state change
            m.redraw();


        } catch (error: any) {
            console.error("Error removing sender via confirmation modal:", error);
            this.errorMessage = error.message || "An error occurred while removing the sender.";
            this.isLoading = false;
            m.redraw(); // Show error message
        }
    }

    private closeModal(): void {
        if (this.modalHandle) {
            modal.remove(this.modalHandle);
        }
    }

    // --- Styling and Lifecycle Methods ---
    private getButtonStyle(defaultColor: string, hoverColor: string, disabled: boolean) { /* ... (copy from previous modal) ... */
         const baseStyle: { [key: string]: any } = {
            background: disabled ? "#cccccc" : defaultColor,
            color: disabled ? "#666666" : "#ffffff", // White text for colored buttons
            border: "none", padding: "12px", borderRadius: "8px",
            cursor: disabled ? "not-allowed" : "pointer", width: "100%",
            fontSize: "14px", fontWeight: "bold", textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background-color 0.2s ease, opacity 0.2s ease",
            opacity: disabled ? 0.6 : 1, marginTop: "10px"
        };
        if (!disabled) {
            baseStyle.onmouseover = (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor;
            baseStyle.onmouseout = (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor;
        }
        return baseStyle;
     }
    private getCancelButtonStyle() { /* ... (copy from previous modal) ... */
        return {
            background: "transparent", color: "#555", border: "1px solid #ccc",
            padding: "12px", borderRadius: "8px", cursor: "pointer",
            width: "100%", fontSize: "14px", fontWeight: "normal",
            textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center",
            marginTop: "10px", transition: "background-color 0.2s ease",
            onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.backgroundColor = "#f0f0f0",
            onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.backgroundColor = "transparent"
        };
     }
    private getModalStyle() { /* ... (copy from previous modal) ... */
         return {
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            padding: "25px", textAlign: "center", background: "#fff",
            boxShadow: "0px 5px 15px rgba(0,0,0,0.25)", borderRadius: "10px",
            width: "90%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "10px"
        };
     }
    hideAnimation(): Promise<void> { return Promise.resolve(); }
    onClose(): void {}
    backgroundClick(e: MouseEvent): void { if (!this.isLoading) this.closeModal(); }
    popState(): boolean { if (!this.isLoading) this.closeModal(); return false; }
    callingElement(): HTMLElement | null { return null; }
    shortcuts(): Shortcut[] { return [{ key: Keys.ESC, exec: () => { if (!this.isLoading) { this.closeModal(); return true; } return false; }, help: "close_alt" }]; }
    setModalHandle(handle: ModalComponent) { this.modalHandle = handle; }
}