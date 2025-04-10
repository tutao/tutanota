import { MobyPhishReportPhishingModal } from "./MobyPhishReportPhishingModal.js";
import { Icon } from "../../../common/gui/base/Icon.js";
import { Icons } from "../../../common/gui/base/icons/Icons.js";
import m, { Children } from "mithril";
import { Keys } from "../../../common/api/common/TutanotaConstants.js";
import { modal, ModalComponent } from "../../../common/gui/base/Modal.js";
import type { Shortcut } from "../../../common/misc/KeyManager.js";
import { MailViewerViewModel, API_BASE_URL, TrustedSenderInfo } from "./MailViewerViewModel.js";

// Inject shared CSS class only once
const styleId = "moby-phish-hover-style";
if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
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
    `;
    document.head.appendChild(style);
}

export class MobyPhishConfirmSenderModal implements ModalComponent {
    private viewModel: MailViewerViewModel;
    private modalHandle?: ModalComponent;
    private selectedSenderEmail: string = "";
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
            this.modalState = 'warning';
            this.selectedSenderEmail = this.viewModel.getSender().address || '';
            this.skippedInitialView = true;
        }
    }

    private formatSenderDisplay(name: string | null | undefined, address: string | null | undefined): string {
        const trimmedName = name?.trim();
        const validAddress = address?.trim() || '';
        if (!validAddress) return trimmedName || "Sender Info Unavailable";
        if (trimmedName && trimmedName !== validAddress) return `${trimmedName} (${validAddress})`;
        return validAddress;
    }

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

    private renderInitialView(): Children {
        const isConfirmDisabled = !this.selectedSenderEmail.trim() || this.isLoading;

        return [
            m("p", { style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "15px" } },
                "Who do you believe this email is from?"),
            m("input[type=text]", {
                placeholder: "Search or type sender email or name...",
                value: this.selectedSenderEmail,
                oninput: (e: Event) => {
                    this.selectedSenderEmail = (e.target as HTMLInputElement).value;
                    this.errorMessage = null;
                },
                list: "trusted-senders-list",
                style: {
                    padding: "10px", width: "100%", boxSizing: "border-box",
                    borderRadius: "8px", border: "1px solid #ccc"
                },
                required: true
            }),
            m("datalist#trusted-senders-list",
                this.trustedSenderObjects.map(sender =>
                    m("option", { value: sender.address }, this.formatSenderDisplay(sender.name, sender.address))
                )
            ),
            this.errorMessage ? m(".error-message", {
                style: { color: 'red', fontSize: '12px', marginTop: '5px' }
            }, this.errorMessage) : null,

            m("button", {
                onclick: async () => {
                    if (isConfirmDisabled) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    const enteredEmail = this.selectedSenderEmail.trim().toLowerCase();
                    const actualEmail = this.viewModel.getSender().address?.trim().toLowerCase();

                    if (enteredEmail === actualEmail) {
                        try {
                            await this.viewModel.updateSenderStatus("confirmed");
                            modal.remove(this.modalHandle!);
                        } catch (err) {
                            console.error(err);
                            this.errorMessage = "Failed to update status. Please try again.";
                            this.isLoading = false;
                            m.redraw();
                        }
                    } else {
                        this.modalState = 'warning';
                        this.isLoading = false;
                        m.redraw();
                    }
                },
                disabled: isConfirmDisabled,
                style: this.getCancelButtonStyle()
            }, "Confirm"),

            m("button", {
                onclick: () => modal.remove(this.modalHandle!),
                disabled: this.isLoading,
                style: this.getCancelButtonStyle()
            }, "Cancel")
        ];
    }

    private renderWarningView(): Children {
        const actual = this.viewModel.getDisplayedSender();
        const address = this.viewModel.getSender().address;
        const actualDisplay = this.formatSenderDisplay(actual?.name, address);
        const canAddSender = !!address;

        let warningText = this.skippedInitialView
            ? "This sender is not on your trusted list:"
            : "You indicated this email might be from:";
        const displaySender = this.skippedInitialView
            ? actualDisplay
            : this.formatSenderDisplay(
                this.trustedSenderObjects.find(s => s.address.toLowerCase() === this.selectedSenderEmail.trim().toLowerCase())?.name,
                this.selectedSenderEmail
            );

        return [
            m("p", {
                style: { fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "5px" }
            }, m(Icon, {
                icon: Icons.Warning,
                style: { fill: '#FFA500', marginRight: '8px', verticalAlign: 'middle' }
            }), "Potential Phishing Attempt"),

            m("p", {
                style: { fontSize: "14px", textAlign: "center", marginBottom: "15px" }
            }, [
                warningText, m("br"), m("strong", displaySender),
                !this.skippedInitialView ? m("br") : null,
                !this.skippedInitialView ? `However, the actual sender is different.` : null
            ]),

            !this.skippedInitialView ? m("p", {
                style: {
                    fontSize: "12px", textAlign: "center",
                    marginBottom: "20px", fontStyle: 'italic'
                }
            }, `(Actual sender: ${actualDisplay})`) : null,

            this.errorMessage ? m(".error-message", {
                style: { color: 'red', fontSize: '12px', marginBottom: '10px' }
            }, this.errorMessage) : null,

            // --- Report First (PRIMARY - with hover class)
            m("button.mobyphish-btn", {
                onclick: () => {
                    if (this.isLoading) return;
                    modal.remove(this.modalHandle!);
                    const reportModal = new MobyPhishReportPhishingModal(this.viewModel);
                    const handle = modal.display(reportModal);
                    reportModal.setModalHandle(handle);
                },
                disabled: this.isLoading
            }, "Report as Phishing"),

            // --- Add Sender (gray/outlined)
            m("button", {
                onclick: async () => {
                    if (this.isLoading || !canAddSender) return;
                    this.isLoading = true;
                    this.errorMessage = null;
                    m.redraw();

                    try {
                        const response = await fetch(`${API_BASE_URL}/add-trusted`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_email: this.viewModel.logins.getUserController().loginUsername,
                                trusted_email: address,
                                trusted_name: actual?.name || ''
                            })
                        });
                        if (!response.ok) throw new Error("Failed to add sender.");
                        await this.viewModel.updateSenderStatus("confirmed");
                        modal.remove(this.modalHandle!);
                    } catch (err: any) {
                        this.errorMessage = err.message || "Error occurred while adding.";
                        this.isLoading = false;
                        m.redraw();
                    }
                },
                disabled: this.isLoading || !canAddSender,
                style: this.getCancelButtonStyle()
            }, `Add ${actualDisplay} to Trusted List`),

            // --- Cancel
            m("button", {
                onclick: () => { if (!this.isLoading) modal.remove(this.modalHandle!); },
                disabled: this.isLoading,
                style: this.getCancelButtonStyle()
            }, "Cancel")
        ];
    }

    private getCancelButtonStyle() {
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

    private getModalStyle() {
        return {
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            padding: "25px", textAlign: "center", background: "#fff",
            boxShadow: "0px 5px 15px rgba(0,0,0,0.25)", borderRadius: "10px",
            width: "90%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "0px"
        };
    }

    hideAnimation(): Promise<void> { return Promise.resolve(); }
    onClose(): void {}
    backgroundClick(e: MouseEvent): void { if (!this.isLoading) modal.remove(this.modalHandle!); }
    popState(): boolean { if (!this.isLoading) modal.remove(this.modalHandle!); return false; }
    callingElement(): HTMLElement | null { return null; }
    shortcuts(): Shortcut[] {
        return [{
            key: Keys.ESC,
            exec: () => {
                if (!this.isLoading) {
                    modal.remove(this.modalHandle!);
                    return true;
                }
                return false;
            },
            help: "close_alt"
        }];
    }
    setModalHandle(handle: ModalComponent) {
        this.modalHandle = handle;
    }
}
