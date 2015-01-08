"use strict";

describe.only("AdminPremiumFeatureViewModelTest", function () {

    var assert = chai.assert;
    var localViewModel;

    beforeEach(function () {
        localViewModel = new tutao.tutanota.ctrl.AdminPremiumFeatureViewModel();
    });


    afterEach(function () {
    });


    it("test neutral codes", function () {
        localViewModel.promotionCode("");
        localViewModel._checkCode();
        assert.equal("neutral", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode(" ");
        localViewModel._checkCode();
        assert.equal("neutral", localViewModel.promotionCodeStatus().type);
    });

    it("test valid codes", function () {
        localViewModel.promotionCode("Cb-Aret-rSt4");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("CB-1234-artf");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("CB-1234-aRtF");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("  Cb-Aret-rSt4");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("Cb-Aret-rSt4  ");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("  Cb-Aret-rSt4  ");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-niw5-emb4");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-hkix-a5bs");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode(" cb-u773-3oib");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-xqrp-aees");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-adcw-nra3");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-aurw-5ydx");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-fc7e-btde");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-zesn-37me");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-gzno-utkq");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-puib-dpbd");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-prok-fmgs");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-5a3e-pkha");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-ghzq-bmbh");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("cb-3yhk-7tc4");
        localViewModel._checkCode();
        assert.equal("valid", localViewModel.promotionCodeStatus().type);
    });

    it("test invalid codes", function () {
        localViewModel.promotionCode("CB");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("CB-1234");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("df-1234-saRtF");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("aCb-1234-saRtF");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("CB-t-rSt4");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("Cb-dAret-rSt4  ");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("Cb-Aret-4");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("Cb-Aret-1rSt4");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
        localViewModel.promotionCode("Cb_Aret_rSt4");
        localViewModel._checkCode();
        assert.equal("invalid", localViewModel.promotionCodeStatus().type);
    });
});