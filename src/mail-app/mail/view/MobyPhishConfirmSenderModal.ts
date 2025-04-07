// MobyPhishConfirmSenderModal.ts

import { MobyPhishReportPhishingModal } from "./MobyPhishReportPhishingModal.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
// Make sure TrustedSenderInfo is exported from MailViewerViewModel.ts
import { MailViewerViewModel, API_BASE_URL, TrustedSenderInfo } from "./MailViewerViewModel.js";

export class MobyPhishConfirmSenderModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;
    private selectedSenderEmail: string = ""; // Store the selected/typed EMAIL address
    private trustedSenderObjects: TrustedSenderInfo[]; // Store the array of {name, address}
    private modalState: 'initial' | 'warning' = 'initial'; // Default state
    private isLoading: boolean = false;
    private errorMessage: string | null = null;
    private skippedInitialView: boolean = false; // Flag to track if initial view was skipped

    constructor(viewModel: MailViewerViewModel, trustedSenders: TrustedSenderInfo[]) {
        this.viewModel = viewModel;
        this.trustedSenderObjects = Array.isArray(trustedSenders)
            ? trustedSenders.filter(s => s && typeof s.address === 'string')
            : [];

        if (this.trustedSenderObjects.length === 0) {
            console.log("Modal Constructor: No trusted senders, starting in warning state.");
            this.modalState = 'warning';
            const actualSenderInfo = this.viewModel.getDisplayedSender();
            this.selectedSenderEmail = actualSenderInfo?.address || '';
            this.skippedInitialView = true;
        }
        console.log(`Modal Constructor: Initialized. State='${this.modalState}', SkippedInitial=${this.skippedInitialView}, Trusted count=${this.trustedSenderObjects.length}, SelectedEmail='${this.selectedSenderEmail}'`);
    }

    // *** REFINED Helper for Display Formatting ***
    private formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
        const trimmedName = name?.trim();
        // Ensure we have a valid address string to work with, default to empty if not
        const validAddress = address?.trim() || '';

        if (!validAddress) {
            // If address is missing, just return the name if it exists, or fallback text
            return trimmedName || "Sender Address Unavailable";
        }

        // Check if name exists and is different from the address
        if (trimmedName && trimmedName !== validAddress) {
            // Case 1: Name exists and is different -> "Name (address)"
            return `${trimmedName} (${validAddress})`;
        } else {
            // Case 2: Name is same as address OR Case 3: Name doesn't exist
            // -> Display only the address
            return validAddress;
        }
    }
    // *** END REFINED Helper ***

    // Main view
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
            m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" } },
              "Who do you believe this email is from?"),

            m("input[type=text]", {
                placeholder: "Search or type sender email or name...",
                value: this.selectedSenderEmail, // Still binds to email for lookup/logic
                oninput: (e: Event) => {
                    this.selectedSenderEmail = (e.target as HTMLInputElement).value;
                    this.errorMessage = null;
                },
                list: "trusted-senders-list",
                style: { /* ... styles ... */ padding: "10px", width: "100%", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #ccc" },
                "aria-label": "Enter or select the trusted sender email", "aria-autocomplete": "list",
                "aria-controls": "trusted-senders-list", required: true
            }),
            // Datalist uses refined helper for display text
            m("datalist#trusted-senders-list",
              this.trustedSenderObjects.map(sender => {
                  const displayText = this.formatSenderDisplay(sender.name, sender.address);
                  // Value remains the email address for selection logic
                  return m("option", { value: sender.address }, displayText);
              })
            ),

            this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px' } }, this.errorMessage) : null,

            // Confirm Button (logic unchanged)
            m("button.btn", {
                onclick: async () => {
                    if (isConfirmDisabled) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    const enteredSenderNormalized = this.selectedSenderEmail.trim().toLowerCase();
                    const actualSenderInfo = this.viewModel.getDisplayedSender();
                    const actualSenderNormalized = actualSenderInfo?.address?.trim().toLowerCase();

                    console.log(`Comparing entered email "${enteredSenderNormalized}" with actual email "${actualSenderNormalized}"`);

                    if (!actualSenderNormalized) {
                         console.error("Could not determine actual sender address for comparison.");
                         this.errorMessage = "Could not verify sender. Please try again.";
                         this.isLoading = false;
                         m.redraw();
                         return;
                    }

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
            }, "Confirm"),

            // Cancel Button
            m("button.btn", {
                onclick: () => modal.remove(this.modalHandle!),
                style: this.getCancelButtonStyle(),
                disabled: this.isLoading
            }, "Cancel")
        ];
    }

    // --- Render Warning/Action View ---
    private renderWarningView(): Children {
        // Get info for the *actual* sender
        const actualSenderInfo = this.viewModel.getDisplayedSender();
        // Format actual sender display using refined helper
        const actualSenderDisplay = actualSenderInfo
             ? this.formatSenderDisplay(actualSenderInfo.name, actualSenderInfo.address)
             : "Sender information unavailable";
        const actualSenderAddress = actualSenderInfo?.address;
        const actualSenderNameToAdd = actualSenderInfo?.name || '';
        const canAddSender = !!actualSenderAddress;

        // Determine display for the 'claimed' sender
        let primaryWarningText = "";
        let senderForPrimaryDisplay = "";

        if (this.skippedInitialView) {
            primaryWarningText = "This sender is not on your trusted list:";
            senderForPrimaryDisplay = actualSenderDisplay; // Display actual sender info
        } else {
            primaryWarningText = "You indicated this email might be from:";
            const enteredEmail = this.selectedSenderEmail.trim().toLowerCase();
            const claimedSenderInfoFromList = this.trustedSenderObjects.find(s => s.address.toLowerCase() === enteredEmail);
            // Format claimed sender display using refined helper
            senderForPrimaryDisplay = this.formatSenderDisplay(
                claimedSenderInfoFromList?.name,
                this.selectedSenderEmail.trim()
            );
        }

        return [
            m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "5px" } },
              m(Icon, { icon: Icons.Warning, style: { fill: '#FFA500', marginRight: '8px', verticalAlign: 'middle' } }),
              "Potential Phishing Attempt"
            ),

            // Conditional Primary Warning Text uses formatted sender
            m("p", { style: { fontSize: "14px", textAlign: "center", marginBottom: "15px" } }, [
                primaryWarningText, m("br"), m("strong", senderForPrimaryDisplay),
                !this.skippedInitialView ? m("br") : null,
                !this.skippedInitialView ? `However, the actual sender is different.` : null
            ]),

            // Conditional Secondary "(Actual Sender:..)" Text uses formatted sender
            !this.skippedInitialView
              ? m("p", { style: { fontSize: "12px", textAlign: "center", marginBottom: "20px", fontStyle: 'italic' } },
                 `(Actual sender: ${actualSenderDisplay})`
               )
              : null,

             this.errorMessage ? m(".error-message", { /* ... */ }, this.errorMessage) : null,

            // Add Actual Sender Button uses formatted sender in label
            m("button.btn.btn-success", {
                onclick: async () => {
                    if (this.isLoading || !canAddSender) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    const senderToAdd = actualSenderAddress!;
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
                style: this.getButtonStyle("#28A745", "#218838", this.isLoading || !canAddSender),
                disabled: this.isLoading || !canAddSender,
                title: !canAddSender ? 'Cannot determine actual sender' : `Add ${actualSenderDisplay} to your trusted list`
            }, `Add Actual Sender (${actualSenderDisplay}) to Trusted List`), // Label uses formatted string

            // Report Phishing Button
            m("button.btn.btn-danger", {
                onclick: () => {
                    if (this.isLoading) return;
                    modal.remove(this.modalHandle!);
                    const reportModal = new MobyPhishReportPhishingModal(this.viewModel);
                    const handle = modal.display(reportModal);
                    reportModal.setModalHandle(handle);
                },
                style: this.getButtonStyle("#DC3545", "#C82333", this.isLoading),
                disabled: this.isLoading
            }, "Report as Phishing"),

            // Cancel Button
            m("button.btn", {
                onclick: () => {
                  if (!this.isLoading) {
                    modal.remove(this.modalHandle!)
                  }
                },
                style: this.getCancelButtonStyle(),
                disabled: this.isLoading
            }, "Cancel")
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

        hideAnimation(): Promise<void> { return Promise.resolve(); }
        onClose(): void {}
        backgroundClick(e: MouseEvent): void { if (!this.isLoading) { modal.remove(this.modalHandle!); } }
        popState(): boolean { if (!this.isLoading) { modal.remove(this.modalHandle!); } return false; }
        callingElement(): HTMLElement | null { return null; }
        shortcuts(): Shortcut[] { return [{ key: Keys.ESC, exec: () => { if (!this.isLoading) { modal.remove(this.modalHandle!); return true; } return false; }, help: "close_alt" }]; }
        setModalHandle(handle: ModalComponent) { this.modalHandle = handle; }

} // End of class MobyPhishConfirmSenderModal