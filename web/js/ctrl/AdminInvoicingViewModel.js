"use strict";

tutao.provide('tutao.tutanota.ctrl.AdminInvoicingViewModel');

tutao.tutanota.ctrl.AdminInvoicingViewModel = function() {
    tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
    var self = this;

    this.business = ko.observable(false);
    this.users = ko.observable(0);
    this.storage = ko.observable(0);

    this.items = ko.observableArray();
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_USERS, name: "bookingItemUsers_label", current: ko.observable("0"), price: ko.observable(0), itemPrice : 1  });
    this.items.push({ type: tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE, name: "bookingItemStorage_label", current: ko.observable("1 GB"), price: ko.observable(0), itemPrice : 1  });

    this.orderStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });
    this.orderSubmitStatus = ko.observable({ type: "neutral", text: "emptyString_msg" });

    this.invoices = ko.observableArray();

    var user = tutao.locator.userController.getLoggedInUser();
    user.loadCustomer().then(function(customer) {
        return customer.loadCustomerInfo().then(function(customerInfo) {
            self._getItem(tutao.entity.tutanota.TutanotaConstants.BOOKING_ITEM_FEATURE_TYPE_STORAGE).current((customerInfo.getStorageCapacity() > 0 ) ? customerInfo.getStorageCapacity() + " GB" : tutao.lang('storageCapacityNoLimit_label'));
            return tutao.entity.sys.Booking.loadRange(customerInfo.getBookings().getItems(), tutao.rest.EntityRestInterface.GENERATED_MAX_ID, 1, true).then(function(bookings) {
                if (bookings.length > 0 ) { // at least one booking must be available
                    var lastBooking = bookings[0];
                    for( var i=0; i<self.items().length; i++) {
                        var currentItem = self.items()[i];

                        var bookingItem = self._getBookingItem(currentItem.type, lastBooking);
                        if (bookingItem) {
                            currentItem.price(self._calculatePrice(bookingItem));
                            currentItem.current(bookingItem.getMaxCount());
                        }
                    }
                }
            }).then(function() {
                return customerInfo.loadAccountingInfo().then(function(accountingInfo) {
                    return accountingInfo.loadInvoiceInfo().then(function(invoiceInfo) {
                        return tutao.rest.EntityRestInterface.loadAll(tutao.entity.sys.Invoice, invoiceInfo.getInvoices()).then(function(invoices) {
                            var publishedInvoices = [];
                            for (var i=0; i<invoices.length;i++) {
                                if (invoices[i].getStatus() > 0) {
                                    publishedInvoices.push(invoices[i]);
                                }
                            }
                            self.invoices(publishedInvoices);
                        });
                    });
                });
            });
        });
    });
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype._getItem = function(type) {
    for( var i=0; i<this.items().length; i++) {
        if (this.items()[i].type == type){
            return this.items()[i];
        }
    }
    throw new Error("item not found");
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype._getBookingItem = function(type, booking) {
    for( var i=0; i<booking.getItems().length; i++){
        if (booking.getItems()[i].getFeatureType() == type){
            return booking.getItems()[i];
        }
    }
    return null;
};

tutao.tutanota.ctrl.AdminInvoicingViewModel.prototype.getTotalPrice = function() {
    var total = 0;
    for (var i=0; i<this.items().length; i++) {
        total += Number(this.items()[i].price());
    }
    return total;
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
    return tutao.entity.sys.PdfInvoiceServiceReturn.load(data, {}).then(function(returnData) {
        var pdfBytes = tutao.util.EncodingConverter.base64ToArray(returnData.getData());
        var tmpFile = new tutao.entity.tutanota.File();
        tmpFile.setName(String(invoice.getNumber()) + ".pdf");
        tmpFile.setMimeType("application/pdf");
        tmpFile.setSize(String(pdfBytes.byteLength));
        tutao.locator.fileFacade.open(new tutao.tutanota.util.DataFile(pdfBytes.buffer, tmpFile));
    });
};
