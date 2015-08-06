"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminInvoicingViewModel');

tutao.tutanota.ctrl.AdminInvoicingViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    var self = this;

    this.business = ko.observable(false);
    this.users = ko.observable(0);
    this.storage = ko.observable(0);

    this.items = ko.observableArray();
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, name: "bookingItemUsers_label", currentAmount: ko.observable(0), nextAmount: ko.observable(0), currentPrice: ko.observable(0), nextPrice: ko.observable(0) });
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, name: "bookingItemStorage_label", currentAmount: ko.observable(1), nextAmount: ko.observable(1), currentPrice: ko.observable(0), nextPrice: ko.observable(0) });

    this.orderStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
    this.orderSubmitStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });

    this.price = ko.observable();
    this.showNextPeriodInfo = ko.observable(false);
    this.invoices = ko.observableArray();

    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            self.items()[1].currentAmount(customerInfo.getStorageCapacity());
            self.items()[1].nextAmount(customerInfo.getStorageCapacity());
            customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                tutao.util.BookingUtils.getCurrentPrice().then(function(price) {
                    self.price(price);
                    for (var i=0; i<price.getCurrentPriceThisPeriod().getItems().length; i++) {
                        var priceItemData = price.getCurrentPriceThisPeriod().getItems()[i];
                        for (var a=0; a<self.items().length; a++) {
                            var item = self.items()[i];
                            if (item.type == priceItemData.getFeatureType()) {
                                item.currentAmount(Number(priceItemData.getCount()));
                                item.currentPrice(Number(priceItemData.getPrice()));
                                break;
                            }
                        }
                    }
                    for (i=0; i<price.getCurrentPriceNextPeriod().getItems().length; i++) {
                        priceItemData = price.getCurrentPriceNextPeriod().getItems()[i];
                        for (a=0; a<self.items().length; a++) {
                            item = self.items()[i];
                            if (item.type == priceItemData.getFeatureType()) {
                                item.nextAmount(Number(priceItemData.getCount()));
                                item.nextPrice(Number(priceItemData.getPrice()));
                                if (item.nextAmount() != item.currentAmount() || item.nextPrice() != item.currentPrice()) {
                                    self.showNextPeriodInfo(true);
                                }
                                break;
                            }
                        }
                    }
                });
            });
            return customerInfo;
        }).then(function(customerInfo) {
            return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                return accountingInfo.loadInvoiceInfo().then(function(invoiceInfo) {
                    return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.Invoice, invoiceInfo.getInvoices()).then(function(invoices) {
                        var publishedInvoices = [];
                        for (var i=0; i<invoices.length;i++) {
                            if (invoices[i].getStatus() != 0 && invoices[i].getStatus() != 6 && invoices[i].getStatus() != 7) {
                                publishedInvoices.push(invoices[i]);
                            }
                        }
                        self.invoices(publishedInvoices);
                    });
                });
            });
        });
    });
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getSubscriptionTextId = function() {
    if (!this.price()) {
        return 'loading_msg';
    } else {
        return (this.price().getCurrentPriceNextPeriod().getPaymentInterval() == 12) ? 'yearly_label' : 'monthly_label'
    }
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getEndOfSubscriptionText = function() {
    if (!this.price()) {
        return tutao.lang('loading_msg');
    } else {
        return tutao.lang("endOfSubscriptionPeriod_label", {"{1}": tutao.tutanota.util.Formatter.formatDate(this.price().getPeriodEndDate())});
    }
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getUsageTextId = function() {
    if (!this.price()) {
        return 'loading_msg';
    } else {
        return (this.price().getCurrentPriceNextPeriod().getTaxIncluded()) ? 'privateUse_label' : 'businessUse_label';
    }
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getNetGrossInfoTextId = function() {
    if (!this.price()) {
        return 'loading_msg';
    } else {
        return (this.price().getCurrentPriceNextPeriod().getTaxIncluded()) ? 'priceIncludesTaxes_msg' : 'priceExcludesTaxes_msg';
    }
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getAmountText = function(item) {
    var unitPostfix = "";
    if (item.type == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE) {
        unitPostfix = " GB";
    }
    if (!this.price()) {
        return tutao.lang('loading_msg');
    } else if (item.currentAmount() != item.nextAmount()) {
        return item.currentAmount() + unitPostfix + " (" + item.nextAmount() + unitPostfix + ")*";
    } else {
        return item.currentAmount() + unitPostfix;
    }
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getPriceText = function(item) {
    if (!this.price()) {
        return tutao.lang('loading_msg');
    } else if (item.currentPrice() != item.nextPrice()) {
        return tutao.util.BookingUtils.formatPrice(item.currentPrice()) + " (" + tutao.util.BookingUtils.formatPrice(item.nextPrice()) + ")*";
    } else {
        return tutao.util.BookingUtils.formatPrice(item.currentPrice());
    }
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getTotalPriceText = function() {
    if (!this.price()) {
        return tutao.lang('loading_msg');
    } else if (this.price().getCurrentPriceThisPeriod().getPrice() != this.price().getCurrentPriceNextPeriod().getPrice()) {
        return tutao.util.BookingUtils.formatPrice(Number(this.price().getCurrentPriceThisPeriod().getPrice())) + " (" + tutao.util.BookingUtils.formatPrice(Number(this.price().getCurrentPriceNextPeriod().getPrice())) + ")*";
    } else {
        return tutao.util.BookingUtils.formatPrice(Number(this.price().getCurrentPriceThisPeriod().getPrice()));
    }
};


tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype._calculatePrice = function(bookingItem) {
    var totalPrice = 0;
    if (bookingItem.getPriceType() == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_PRICE_TYPE_SINGLE){
        totalPrice = Number(bookingItem.getPrice()) * bookingItem.getMaxCount();
    } else if (bookingItem.getPriceType() == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_PRICE_TYPE_PACKAGE) {
        totalPrice = Number(bookingItem.getPrice());
    } else if (bookingItem.getPriceType() == tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_PRICE_TYPE_TOTAL) {
        totalPrice = Number(bookingItem.getPrice());
    }
    return totalPrice;
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.downloadPdf = function(invoice) {
    var data = new tutao.entity.sys.PdfInvoiceServiceData();
    data.setInvoice(invoice.getId());
    return tutao.entity.sys.PdfInvoiceServiceReturn.load(data, {}, null).then(function(returnData) {
        // the session key for the pdf data is the same as the invoice session key
        returnData.getEntityHelper().setSessionKey(invoice.getEntityHelper().getSessionKey());
        var pdfBytes = tutao.util.EncodingConverter.base64ToArray(returnData.getData());
        var tmpFile = new tutao.entity.tutanota.File();
        tmpFile.setName(String(invoice.getNumber()) + ".pdf");
        tmpFile.setMimeType("application/pdf");
        tmpFile.setSize(String(pdfBytes.byteLength));
        tutao.locator.fileFacade.open(new tutao.tutanota.util.DataFile(pdfBytes.buffer, tmpFile));
    });
};
