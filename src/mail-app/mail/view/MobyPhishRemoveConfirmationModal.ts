// src/mail-app/mail/view/MobyPhishRemoveConfirmationModal.ts

import m, { Children } from "mithril";
import { Keys, ContentBlockingStatus } from "../../../common/api/common/TutanotaConstants.js"; // Import ContentBlockingStatus
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import { MailViewerViewModel, API_BASE_URL, TrustedSenderInfo } from "./MailViewerViewModel.js"; // Import ViewModel, API URL, ContentBlockingStatus

// Helper function for consistent display: "Name (address)" or "address"
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
    private senderAddress: string; // Store the address to be removed
    private isLoading: boolean = false;
    private errorMessage: string | null = null;

    constructor(viewModel: MailViewerViewModel) {
        this.viewModel = viewModel;
        // Get sender info for the *currently viewed* email
        // We need the address to pass to the API calls
        const address = this.viewModel.mail.sender.address;
        const name = this.viewModel.mail.sender.name || '';
        this.senderAddress = address; // Store the address for removal/resetting
        this.senderDisplay = formatSenderDisplay(name, address); // Format for display
    }

    view(): Children {
        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" } },
                        "Remove from Trusted Senders?"
                    ),
                    m("p", { style: { fontSize: "14px", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" } }, [
                        "Are you sure you want to remove ",
                        m("strong", this.senderDisplay), // Use formatted display string
                        " from your trusted senders list?",
                        m("br"),
                        m("span", { style: { fontSize: '12px', color: '#6c757d' } }, "(This action will also reset the status for all previous emails from this sender.)") // Updated warning
                    ]),

                    this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px', marginBottom: '10px' } }, this.errorMessage) : null,

                    // Confirm Remove Button
                    m("button.btn.btn-danger", {
                        onclick: () => this.confirmRemoveSender(),
                        disabled: this.isLoading,
                        style: this.getButtonStyle("#DC3545", "#C82333", this.isLoading)
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
        // Use the sender address stored during construction
        const senderToRemove = this.senderAddress;

        console.log(`Remove Confirmation Modal: Removing User=${userEmail}, Email=${senderToRemove}`);

        let removeSuccess = false; // Flag to track if removal from list was successful

        try {
            // --- Step 1: Remove from trusted list ---
            const removeResponse = await fetch(`${API_BASE_URL}/remove-trusted`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_email: userEmail,
                    trusted_email: senderToRemove,
                })
            });

            if (removeResponse.ok) {
                console.log(`Sender "${senderToRemove}" removed from trusted list.`);
                removeSuccess = true; // Mark removal as successful
            } else if (removeResponse.status === 404) {
                console.warn("Attempted to remove sender who was not found in trusted list. Assuming already removed.");
                removeSuccess = true; // Treat as success for proceeding to reset statuses
            } else {
                // Handle other errors during removal
                const errorData = await removeResponse.json().catch(() => ({}));
                throw new Error(`Failed to remove sender (${removeResponse.status}): ${errorData.message || 'Unknown error'}`);
            }

            // --- Step 2: Reset all email statuses for this sender (only if removal was successful or sender wasn't found) ---
            if (removeSuccess) {
                console.log(`Remove Confirmation Modal: Resetting email statuses for User=${userEmail}, Sender=${senderToRemove}`);
                const resetResponse = await fetch(`${API_BASE_URL}/reset-email-statuses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_email: userEmail,
                        sender_email: senderToRemove, // Use sender email to match status entries
                    })
                });

                if (!resetResponse.ok) {
                    const errorData = await resetResponse.json().catch(() => ({}));
                    console.error(`Failed to reset email statuses (${resetResponse.status}): ${errorData.message || 'Unknown error'}`);
                    // Log the error, but continue with frontend state update
                    this.errorMessage = "Removed sender, but failed to reset existing email statuses."; // Inform user via error message
                } else {
                    console.log(`Email statuses reset successfully for sender "${senderToRemove}".`);
                }
            }

            // --- Step 3: Update frontend state ---
            this.closeModal(); // Close the modal

            // Refresh the trusted senders list to reflect removal
            await this.viewModel.fetchSenderData();

            // Reset the state for the *currently viewed* email in the ViewModel
            this.viewModel.senderStatus = ""; // Clear specific status
            this.viewModel.setSenderConfirmed(false); // Mark as not confirmed
            await this.viewModel.setContentBlockingStatus(ContentBlockingStatus.Block); // Block content

            m.redraw(); // Trigger UI update

        } catch (error: any) {
            console.error("Error during remove sender process:", error);
            // Set error message to display in the modal
            this.errorMessage = error.message || "An error occurred while removing the sender.";
            this.isLoading = false; // Stop loading indicator
            m.redraw(); // Show error message in the modal
        }
    }

    private closeModal(): void {
        if (this.modalHandle) {
            modal.remove(this.modalHandle);
        }
    }

    // --- Styling and Lifecycle Methods (Keep as they were) ---
    private getButtonStyle(defaultColor: string, hoverColor: string, disabled: boolean) { /* ... */
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
    private getCancelButtonStyle() { /* ... */
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
    private getModalStyle() { /* ... */
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