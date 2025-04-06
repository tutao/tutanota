// Add near other imports in MobyPhishConfirmSenderModal.ts
import { MobyPhishReportPhishingModal } from "./MobyPhishReportPhishingModal.js";
// Ensure API_BASE_URL is correctly imported or defined if needed within this file
// import { API_BASE_URL } from "./MailViewerViewModel.js"; // Or appropriate path
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel, API_BASE_URL } from "./MailViewerViewModel.js"; // Import API_BASE_URL from ViewModel

export class MobyPhishConfirmSenderModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;
    private selectedSender: string = "";
    // No longer need trustedSenders passed to constructor for the primary check
    // private trustedSenders: string[];
    private modalState: 'initial' | 'warning' = 'initial'; // State to control view
    private isLoading: boolean = false; // State for API calls
    private errorMessage: string | null = null; // State for API errors

    constructor(viewModel: MailViewerViewModel, trustedSenders: string[]) { // Keep trustedSenders for datalist
        this.viewModel = viewModel;
        // We still need trustedSenders to populate the datalist, but not for the core logic check
        // this.trustedSenders = (trustedSenders || []).map(s => s?.trim().toLowerCase()).filter(Boolean);
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
        const isConfirmDisabled = !this.selectedSender.trim() || this.isLoading;
        // We'll get enteredSenderNormalized inside the onclick

        return [
            m("p", {
                style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" }
            }, "Who do you believe this email is from?"),

            // Input field
            m("input[type=text]", {
                placeholder: "Search or type a known sender...",
                value: this.selectedSender,
                oninput: (e: Event) => {
                    this.selectedSender = (e.target as HTMLInputElement).value;
                    this.errorMessage = null; // Clear error on input
                },
                list: "trusted-senders-list",
                style: {
                    padding: "10px",
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: "8px",
                    border: "1px solid #ccc"
                },
                "aria-label": "Enter or select the trusted sender email",
                "aria-autocomplete": "list",
                "aria-controls": "trusted-senders-list",
                required: true
            }),
            m("datalist#trusted-senders-list",
              (this.viewModel.trustedSenders() || []).filter(sender => sender && sender.trim()).map(sender => // Use live data from viewmodel for datalist
                  m("option", { value: sender })
              )
            ),

            // Optional Error Display
             this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px' } }, this.errorMessage) : null,


            // Confirm Button --- LOGIC CORRECTED HERE ---
            m("button.btn", {
                onclick: async () => {
                    if (isConfirmDisabled) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw(); // Show loading state

                    const enteredSenderNormalized = this.selectedSender.trim().toLowerCase();
                    // Get the ACTUAL sender of the email from the viewModel
                    const actualSenderNormalized = this.viewModel.getSender().address.trim().toLowerCase();

                    console.log(`Comparing entered sender "${enteredSenderNormalized}" with actual sender "${actualSenderNormalized}"`);

                    if (enteredSenderNormalized === actualSenderNormalized) {
                        // User correctly identified the actual sender.
                        console.log(`Entered sender matches actual sender. Confirming.`);
                        try {
                            // Treat as confirmed: update status, unblock content
                            await this.viewModel.updateSenderStatus("confirmed");
                            modal.remove(this.modalHandle!);
                            // updateSenderStatus handles redraw
                        } catch (error) {
                            console.error("Error updating status after confirming matching sender:", error);
                            this.errorMessage = "Failed to update status. Please try again.";
                            this.isLoading = false;
                            m.redraw();
                        }
                    } else {
                        // User entered a sender that DOES NOT match the actual sender. THIS IS THE WARNING CASE.
                        console.log(`Entered sender DOES NOT match actual sender. Switching to warning view.`);
                        this.modalState = 'warning';
                        this.isLoading = false; // Stop loading indicator for initial view
                        m.redraw(); // Switch to the warning view
                    }
                },
                disabled: isConfirmDisabled,
                style: this.getButtonStyle("#D4EDDA", "#C3E6CB", isConfirmDisabled)
            }, this.isLoading ? "Processing..." : "Confirm"),

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
        const claimedSender = this.selectedSender.trim(); // Keep original casing for display
        const actualSender = this.viewModel.getSender().address;

        return [
            m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "5px" } },
              m(Icon, { icon: Icons.Warning, style: { fill: '#FFA500', marginRight: '8px', verticalAlign: 'middle' } }), // Warning Icon
              "Potential Phishing Attempt"
            ),
            m("p", { style: { fontSize: "14px", textAlign: "center", marginBottom: "15px" } },
                // Clarify the warning message
                `You indicated this email might be from "${claimedSender}", but the actual sender is different.`
            ),
            m("p", { style: { fontSize: "12px", textAlign: "center", marginBottom: "20px", fontStyle: 'italic' } },
                 `(Actual sender: ${actualSender})`
            ),

             // Optional Error Display
             this.errorMessage ? m(".error-message", { style: { color: 'red', fontSize: '12px', marginTop: '5px', marginBottom: '10px' } }, this.errorMessage) : null,


            // Add *Actual* Sender to Trusted Senders Button
            m("button.btn.btn-success", {
                onclick: async () => {
                    if (this.isLoading) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    // IMPORTANT: Add the *ACTUAL* sender, not the one they incorrectly entered
                    const senderToAdd = actualSender;
                    const userEmail = this.viewModel.logins.getUserController().loginUsername;

                    try {
                        const response = await fetch(`${API_BASE_URL}/add-trusted`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_email: userEmail,
                                trusted_email: senderToAdd // Add the ACTUAL sender
                            })
                        });

                        if (!response.ok) {
                             const errorData = await response.json().catch(() => ({}));
                             throw new Error(errorData.message || `Failed to add sender (${response.status})`);
                        }

                        console.log(`Actual sender "${senderToAdd}" added to trusted list via warning modal.`);
                        // Update status to 'confirmed' which refreshes data and UI
                        await this.viewModel.updateSenderStatus("confirmed");
                        modal.remove(this.modalHandle!);
                        // updateSenderStatus will redraw

                    } catch (error: any) {
                        console.error("Error adding actual sender:", error);
                        this.errorMessage = error.message || "An error occurred while adding the sender.";
                        this.isLoading = false;
                        m.redraw();
                    }
                },
                style: this.getButtonStyle("#28A745", "#218838", this.isLoading), // Green button
                disabled: this.isLoading
            }, this.isLoading ? m(Icon, {icon: Icons.Loading, spin: true}) : `Add Actual Sender (${actualSender}) to Trusted List`), // Update label

            // Report Phishing Button
            m("button.btn.btn-danger", {
                onclick: () => {
                    if (this.isLoading) return;
                    console.log("Report Phishing button clicked from warning modal.");
                    modal.remove(this.modalHandle!);
                    const reportModal = new MobyPhishReportPhishingModal(this.viewModel);
                    const handle = modal.display(reportModal);
                    reportModal.setModalHandle(handle);
                },
                style: this.getButtonStyle("#DC3545", "#C82333", this.isLoading), // Red button
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
    // (Keep the getButtonStyle, getCancelButtonStyle, getModalStyle, hideAnimation, onClose, backgroundClick, popState, callingElement, shortcuts, setModalHandle methods as they were)
     // Modified style function to handle disabled state
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
}