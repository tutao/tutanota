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
    private trustedSenderObjects: TrustedSenderInfo[];
    private modalState: 'initial' | 'warning' = 'initial';
    private isLoading: boolean = false;
    private errorMessage: string | null = null;
    private skippedInitialView: boolean = false;

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

    // Helper for Display Formatting: "Name (address)" or "address"
    private formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
        const trimmedName = name?.trim();
        const validAddress = address || '';
        if (!validAddress) return trimmedName || "Invalid Sender Info";
        if (trimmedName) return `${trimmedName} (${validAddress})`;
        else return validAddress;
    }

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
            m("p", { /* ... */ }, "Who do you believe this email is from?"),
            m("input[type=text]", { /* ... */ }),
            m("datalist#trusted-senders-list",
              this.trustedSenderObjects.map(sender => {
                  const displayText = this.formatSenderDisplay(sender.name, sender.address);
                  return m("option", { value: sender.address }, displayText);
              })
            ),
            this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px' } }, this.errorMessage) : null,

            // Confirm Button
            m("button.btn", {
                onclick: async () => {
                    if (isConfirmDisabled) return;
                    this.isLoading = true;
                    this.errorMessage = null; // Clear previous errors
                    m.redraw();

                    const enteredSenderNormalized = this.selectedSenderEmail.trim().toLowerCase();
                    // Get actual sender info *here*, just before comparison
                    const actualSenderInfo = this.viewModel.getDisplayedSender();
                    const actualSenderNormalized = actualSenderInfo?.address?.trim().toLowerCase();

                    console.log(`Comparing entered email "${enteredSenderNormalized}" with actual email "${actualSenderNormalized}"`);

                    // *** REMOVED Premature Check for actualSenderNormalized ***
                    // We proceed directly to the comparison. If actualSenderNormalized is
                    // somehow undefined here (which shouldn't happen for non-system mail),
                    // the comparison will fail, leading to the warning view, which is acceptable.

                    if (actualSenderNormalized && enteredSenderNormalized === actualSenderNormalized) {
                        // Actual sender MUST be determined AND must match
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
                        // Handles both mismatch and the unlikely case actualSenderNormalized was undefined
                        console.log(`Entered email DOES NOT match actual email OR actual sender unknown. Switching to warning view.`);
                        this.modalState = 'warning';
                        this.isLoading = false;
                        m.redraw();
                    }
                },
                disabled: isConfirmDisabled,
                style: this.getButtonStyle("#D4EDDA", "#C3E6CB", isConfirmDisabled)
            }, this.isLoading ? "Processing..." : "Confirm"), // Keep loader on Confirm button itself

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
        const actualSenderInfo = this.viewModel.getDisplayedSender();
        const actualSenderDisplay = actualSenderInfo
             ? this.formatSenderDisplay(actualSenderInfo.name, actualSenderInfo.address)
             : "Sender information unavailable";
        const actualSenderAddress = actualSenderInfo?.address;
        const actualSenderNameToAdd = actualSenderInfo?.name || '';
        const canAddSender = !!actualSenderAddress;

        let primaryWarningText = "";
        let senderForPrimaryDisplay = "";

        if (this.skippedInitialView) {
            primaryWarningText = "This sender is not on your trusted list:";
            senderForPrimaryDisplay = actualSenderDisplay;
        } else {
            primaryWarningText = "You indicated this email might be from:";
            const enteredEmail = this.selectedSenderEmail.trim().toLowerCase();
            const claimedSenderInfoFromList = this.trustedSenderObjects.find(s => s.address.toLowerCase() === enteredEmail);
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
            m("p", { style: { fontSize: "14px", textAlign: "center", marginBottom: "15px" } }, [
                primaryWarningText,
                m("br"),
                m("strong", senderForPrimaryDisplay),
                !this.skippedInitialView ? m("br") : null,
                !this.skippedInitialView ? `However, the actual sender is different.` : null
            ]),
            !this.skippedInitialView
              ? m("p", { style: { fontSize: "12px", textAlign: "center", marginBottom: "20px", fontStyle: 'italic' } },
                 `(Actual sender: ${actualSenderDisplay})`
               )
              : null,

             this.errorMessage ? m(".error-message", { /* ... */ }, this.errorMessage) : null,

            // Add Actual Sender Button
            m("button.btn.btn-success", {
                onclick: async () => {
                    if (this.isLoading || !canAddSender) return;
                    this.isLoading = true; // Still set loading for the API call duration
                    this.errorMessage = null;
                    m.redraw(); // Redraw to disable buttons

                    const senderToAdd = actualSenderAddress!;
                    const nameToAdd = actualSenderNameToAdd;
                    const userEmail = this.viewModel.logins.getUserController().loginUsername;

                    try {
                        // ... fetch call ...
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
                        modal.remove(this.modalHandle!); // Close on success

                    } catch (error: any) {
                        console.error("Error adding actual sender:", error);
                        this.errorMessage = error.message || "An error occurred while adding the sender.";
                        this.isLoading = false; // Reset loading on error
                        m.redraw(); // Show error
                    }
                     // Removed finally block that was resetting isLoading, only reset on error or success completion
                },
                style: this.getButtonStyle("#28A745", "#218838", this.isLoading || !canAddSender),
                disabled: this.isLoading || !canAddSender,
                title: !canAddSender ? 'Cannot determine actual sender' : `Add ${actualSenderDisplay} to your trusted list`
            // *** MODIFICATION: Removed loading icon from label ***
            }, `Add Actual Sender (${actualSenderDisplay}) to Trusted List`), // Label is always text now

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
    private getButtonStyle(defaultColor: string, hoverColor: string, disabled: boolean) {
        const baseStyle: { [key: string]: any } = {
            background: disabled ? "#cccccc" : defaultColor,
            color: disabled ? "#666666" : (defaultColor === "#28A745" || defaultColor === "#DC3545" ? "#ffffff" : "#000"),
            border: "none", padding: "12px", borderRadius: "8px",
            cursor: disabled ? "not-allowed" : "pointer",
            width: "100%", fontSize: "14px", fontWeight: "bold",
            textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background-color 0.2s ease, opacity 0.2s ease",
            opacity: disabled ? 0.6 : 1, marginTop: "10px"
        };
        if (!disabled) {
            baseStyle.onmouseover = (e: MouseEvent) => (e.target as HTMLElement).style.background = hoverColor;
            baseStyle.onmouseout = (e: MouseEvent) => (e.target as HTMLElement).style.background = defaultColor;
        }
        return baseStyle;
    }
    private getCancelButtonStyle() { /* ... same as before ... */
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
    private getModalStyle() { /* ... same as before ... */
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