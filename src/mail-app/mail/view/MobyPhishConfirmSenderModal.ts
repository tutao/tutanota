// MobyPhishConfirmSenderModal.ts

import { MobyPhishReportPhishingModal } from "./MobyPhishReportPhishingModal.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel, API_BASE_URL } from "./MailViewerViewModel.js"; // Import API_BASE_URL and TrustedSenderInfo interface from ViewModel

// Note: Removed local TrustedSenderInfo interface definition as it's now imported from ViewModel


export class MobyPhishConfirmSenderModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;
    private selectedSenderEmail: string = ""; // Store the selected/typed EMAIL address
    private trustedSenderObjects: TrustedSenderInfo[]; // Store the array of {name, address}
    private modalState: 'initial' | 'warning' = 'initial'; // Default state
    private isLoading: boolean = false;
    private errorMessage: string | null = null;

    constructor(viewModel: MailViewerViewModel, trustedSenders: TrustedSenderInfo[]) {
        this.viewModel = viewModel;
        // Ensure it's an array and filter out any potentially bad entries
        this.trustedSenderObjects = Array.isArray(trustedSenders)
            ? trustedSenders.filter(s => s && typeof s.address === 'string')
            : [];

        // *** Step 5: Skip Logic ***
        // If the list is empty, skip straight to the warning
        if (this.trustedSenderObjects.length === 0) {
            console.log("Modal Constructor: No trusted senders, starting in warning state.");
            this.modalState = 'warning';
            // Pre-fill selected email with actual sender's email for warning view display
            // GetSender() returns MailAddress which requires address
            this.selectedSenderEmail = this.viewModel.getSender().address;
        }
        // *** End Skip Logic ***

        console.log(`Modal Constructor: Initialized. State='${this.modalState}', Trusted count=${this.trustedSenderObjects.length}, SelectedEmail='${this.selectedSenderEmail}'`);
    }

    // *** Step 1: Implement Display Format Helper ***
    private formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
        const trimmedName = name?.trim();
        const validAddress = address || ''; // Use empty string if address is missing (shouldn't happen for actual sender)

        if (!validAddress) {
            // This case is highly unlikely for the actual sender based on types,
            // but handle defensively for display.
            return trimmedName || "Invalid Sender Info";
        }

        if (trimmedName) {
            // Format: Name (address@example.com)
            return `${trimmedName} (${validAddress})`;
        } else {
            // Format: address@example.com
            return validAddress;
        }
    }
    // *** End Helper ***

    // Main view decides which sub-view to render
    view(): Children {
        return m(".modal-overlay", { onclick: (e: MouseEvent) => this.backgroundClick(e) }, [
            m(".modal-content", { onclick: (e: MouseEvent) => e.stopPropagation() }, [
                m(".dialog.elevated-bg.border-radius", { style: this.getModalStyle() }, [
                    this.modalState === 'initial'
                        ? this.renderInitialView()
                        : this.renderWarningView()
                ])
            ])
        ]);
    }

    // --- Render Initial Input View ---
    private renderInitialView(): Children {
        const isConfirmDisabled = !this.selectedSenderEmail.trim() || this.isLoading;

        return [
            m("p", {
                style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" }
            }, "Who do you believe this email is from?"),

            // Input field - value is the selected EMAIL address
            m("input[type=text]", {
                placeholder: "Search or type sender email or name...", // Updated placeholder
                value: this.selectedSenderEmail,
                oninput: (e: Event) => {
                    this.selectedSenderEmail = (e.target as HTMLInputElement).value;
                    this.errorMessage = null;
                },
                list: "trusted-senders-list",
                style: { /* ... styles ... */ },
                "aria-label": "Enter or select the trusted sender email",
                "aria-autocomplete": "list",
                "aria-controls": "trusted-senders-list",
                required: true
            }),
            // *** Step 2: Update Datalist Options ***
            m("datalist#trusted-senders-list",
              this.trustedSenderObjects
                .map(sender => {
                    // Use helper for display text
                    const displayText = this.formatSenderDisplay(sender.name, sender.address);
                    return m("option", { value: sender.address }, displayText); // VALUE is always address
                 })
            ),
            // *** End Datalist Update ***

            // ... (Error Message, Confirm Button, Cancel Button - logic inside confirm is unchanged) ...
             this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px' } }, this.errorMessage) : null,
             m("button.btn", {
                onclick: async () => {
                    if (isConfirmDisabled) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    const enteredSenderNormalized = this.selectedSenderEmail.trim().toLowerCase();
                    // Rely on getSender() here as it's guaranteed by Mail type
                    const actualSenderNormalized = this.viewModel.getSender().address.trim().toLowerCase();

                    console.log(`Comparing entered email "${enteredSenderNormalized}" with actual email "${actualSenderNormalized}"`);

                    if (enteredSenderNormalized === actualSenderNormalized) {
                        console.log(`Entered email matches actual email. Confirming.`);
                        try {
                            await this.viewModel.updateSenderStatus("confirmed");
                            modal.remove(this.modalHandle!);
                        } catch (error) {
                            console.error("Error updating status after confirming matching sender:", error);
                            this.errorMessage = "Failed to update status. Please try again.";
                            this.isLoading = false;
                            m.redraw();
                        }
                    } else {
                        console.log(`Entered email DOES NOT match actual email. Switching to warning view.`);
                        this.modalState = 'warning';
                        this.isLoading = false;
                        m.redraw();
                    }
                },
                disabled: isConfirmDisabled,
                style: this.getButtonStyle("#D4EDDA", "#C3E6CB", isConfirmDisabled)
            }, this.isLoading ? "Processing..." : "Confirm"),
             m("button.btn", {
                onclick: () => modal.remove(this.modalHandle!),
                style: this.getCancelButtonStyle(),
                disabled: this.isLoading
            }, "Cancel")
        ];
    }

    // --- Render Warning/Action View ---
    private renderWarningView(): Children {
        const enteredEmail = this.selectedSenderEmail.trim().toLowerCase();

        // Find the object corresponding to the email the user *selected/typed* OR the pre-filled one
        const claimedSenderInfoFromList = this.trustedSenderObjects.find(s => s.address.toLowerCase() === enteredEmail);

        // *** Step 3: Update Warning View Display (Claimed) ***
        // Use name from list if found, otherwise use null. Use the entered/pre-filled email address.
        const claimedSenderDisplay = this.formatSenderDisplay(
            claimedSenderInfoFromList?.name,
            this.selectedSenderEmail.trim() // Use the email stored in state
        );

        // Get info for the *actual* sender of the current email
        const actualSenderInfo = this.viewModel.getDisplayedSender(); // Returns {name, address} | null

        // *** Step 3 & 4: Update Warning View Display (Actual) & Fix "Unknown" ***
        // Format ACTUAL sender using helper. Rely on actualSenderInfo existing and having an address
        // because this modal shouldn't be reachable for system notifications where it might be null.
        const actualSenderDisplay = actualSenderInfo
             ? this.formatSenderDisplay(actualSenderInfo.name, actualSenderInfo.address)
             : "Sender information unavailable"; // Fallback if getDisplayedSender was unexpectedly null

        const actualSenderAddress = actualSenderInfo?.address; // Get address for logic
        const actualSenderNameToAdd = actualSenderInfo?.name || ''; // Get name for logic

        // Check if we can actually add the sender (address must be known)
        const canAddSender = !!actualSenderAddress;

        return [
            m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "5px" } },
              m(Icon, { icon: Icons.Warning, style: { fill: '#FFA500', marginRight: '8px', verticalAlign: 'middle' } }),
              "Potential Phishing Attempt"
            ),
            // Display using the new formatted strings
            m("p", { style: { fontSize: "14px", textAlign: "center", marginBottom: "15px" } }, [
                // Handle the case where the warning view was entered directly (no trusted list)
                this.trustedSenderObjects.length > 0
                  ? `You indicated this email might be from:`
                  : `This sender is not on your trusted list:`, // Different text if list was empty
                m("br"),
                m("strong", claimedSenderDisplay), // Show formatted claimed/actual sender
                m("br"),
                // Only show this line if the claimed/selected differs from actual
                (this.selectedSenderEmail.trim().toLowerCase() !== actualSenderAddress?.toLowerCase()) && this.trustedSenderObjects.length > 0
                  ? `However, the actual sender is different.`
                  : null
            ]),
            // Always show the actual sender clearly if it differs from claimed (or if warning shown directly)
            (this.selectedSenderEmail.trim().toLowerCase() !== actualSenderAddress?.toLowerCase() || this.trustedSenderObjects.length === 0)
              ? m("p", { style: { fontSize: "12px", textAlign: "center", marginBottom: "20px", fontStyle: 'italic' } },
                 `(Actual sender: ${actualSenderDisplay})` // Show formatted actual sender
               )
              : null,

             this.errorMessage ? m(".error-message", { /* ... */ }, this.errorMessage) : null,

            // *** Step 3: Update Add Button Label & Disable if needed ***
            m("button.btn.btn-success", {
                onclick: async () => { /* ... (onclick logic is okay) ... */
                    if (this.isLoading || !canAddSender) return; // Use flag
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    const senderToAdd = actualSenderAddress!; // Use Non-null assertion (!) as we checked canAddSender
                    const nameToAdd = actualSenderNameToAdd;
                    const userEmail = this.viewModel.logins.getUserController().loginUsername;

                    try {
                        const response = await fetch(`${API_BASE_URL}/add-trusted`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_email: userEmail,
                                trusted_email: senderToAdd,
                                trusted_name: nameToAdd
                            })
                        });

                        if (!response.ok) {
                             const errorData = await response.json().catch(() => ({}));
                             throw new Error(errorData.message || `Failed to add sender (${response.status})`);
                        }

                        console.log(`Actual sender "${senderToAdd}" added to trusted list via warning modal.`);
                        await this.viewModel.updateSenderStatus("confirmed");
                        modal.remove(this.modalHandle!);

                    } catch (error: any) {
                        console.error("Error adding actual sender:", error);
                        this.errorMessage = error.message || "An error occurred while adding the sender.";
                        this.isLoading = false;
                        m.redraw();
                    }
                },
                style: this.getButtonStyle("#28A745", "#218838", this.isLoading || !canAddSender), // Disable if cannot add
                disabled: this.isLoading || !canAddSender, // Disable if cannot add
                title: !canAddSender ? 'Cannot determine actual sender' : `Add ${actualSenderDisplay} to your trusted list`
            }, `Add Actual Sender (${actualSenderDisplay}) to Trusted List`), // Use formatted string

            // Report Phishing Button (logic unchanged)
            m("button.btn.btn-danger", { /* ... */ }),

            // Cancel Button (logic unchanged)
            m("button.btn", { /* ... */ })
        ];
    }

    // --- Helper Functions (Styles, Lifecycle, etc.) ---
    // (Keep all helper functions: getButtonStyle, getCancelButtonStyle, getModalStyle, etc.) ...
         private getButtonStyle(defaultColor: string, hoverColor: string, disabled: boolean) {
            const baseStyle: { [key: string]: any } = {
                background: disabled ? "#cccccc" : defaultColor,
                color: disabled ? "#666666" : (defaultColor === "#28A745" || defaultColor === "#DC3545" ? "#ffffff" : "#000"), // White text for colored buttons
                border: "none",
                padding: "12px", // Slightly smaller padding for more buttons
                borderRadius: "8px",
                cursor: disabled ? "not-allowed" : "pointer",
                width: "100%",
                fontSize: "14px", // Slightly smaller font
                fontWeight: "bold",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s ease, opacity 0.2s ease",
                opacity: disabled ? 0.6 : 1,
                marginTop: "10px" // Add margin between buttons
            };

            if (!disabled) {
                baseStyle.onmouseover = (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor;
                baseStyle.onmouseout = (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor;
            }

            return baseStyle;
        }

        private getCancelButtonStyle() {
            return {
                background: "transparent",
                color: "#555", // Darker grey for cancel
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
                onmouseover: (e: MouseEvent) => (e.target as HTMLElement).style.backgroundColor = "#f0f0f0",
                onmouseout: (e: MouseEvent) => (e.target as HTMLElement).style.backgroundColor = "transparent"
            };
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
                width: "90%", // Responsive width
                maxWidth: "420px", // Slightly wider for warning content
                display: "flex",
                flexDirection: "column",
                gap: "0px" // Reduce gap, rely on button margins
            };
        }

        hideAnimation(): Promise<void> {
            return Promise.resolve();
        }

        onClose(): void {}

        backgroundClick(e: MouseEvent): void {
            // Prevent closing modal by background click if loading
            if (!this.isLoading) {
                modal.remove(this.modalHandle!);
            }
        }

        popState(): boolean {
            if (!this.isLoading) {
                modal.remove(this.modalHandle!);
            }
            return false;
        }

        callingElement(): HTMLElement | null {
            return null;
        }

        shortcuts(): Shortcut[] {
            return [{
                key: Keys.ESC,
                exec: () => {
                    if (!this.isLoading) { // Prevent ESC close during API call
                       modal.remove(this.modalHandle!);
                       return true;
                    }
                    return false; // Don't handle ESC if loading
                },
                help: "close_alt"
            }];
        }

        setModalHandle(handle: ModalComponent) {
            this.modalHandle = handle;
        }
} // End of class MobyPhishConfirmSenderModal