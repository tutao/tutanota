"use strict";

tutao.provide('tutao.tutanota.ctrl.DeveloperViewModel');
tutao.provide('tutao.tutanota.ctrl.DeveloperTest');

/**
 * @constructor
 * {string} title
 * {function} action
 */
tutao.tutanota.ctrl.DeveloperTest = function(title, action) {
    this.title = title;
    this.action = action;
    this.action.bind(this);
    this.details = ko.observable("");
    this.badge=0;
	

};

/**
 * The ViewModel for the devloper tests wizard.
 * @constructor
 */
tutao.tutanota.ctrl.DeveloperViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);

	this.showDialog = ko.observable(false);
	this.encryptedData = [];
	var developerViewModel = this;
    var self = this;

    this.badge = 0;
    var self = this;

    this.tests = [
        new tutao.tutanota.ctrl.DeveloperTest("getcontacts", function () {
            var self = this;
            tutao.locator.contacts.getAllContacts()
                                                        .then(function (contacts) {
                                                              self.details("loaded " + contacts.length);
                                                              })
                                                        .caught(function (e) {
                                                               console.log(e);
                                                               self.details("could not get contacts");
                                                               });
                                                        }),

        new tutao.tutanota.ctrl.DeveloperTest("Get phone number", function () {
            var self = this;
            tutao.locator.phone.getNumber()
                .then(function (number) {
                    self.details(number);
                })
                .caught(function (e) {
                    console.log(e);
                    self.details("could not fetch phoneNumber");
                });
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Generate rsa key", function () {
            var self = this;
            self.details("started...");
            var start = new Date().getTime();
/*
			var jsonGeneratedKey = "{\"publicKey\":{\"modulus\":\"69NcPtK4sY5gpnSkcXETEdcO0dF90H8w7l1YK77wh7b8Mrpda/3LpYRYJ/kKXove5bPaf6uFdwh6GEeDRHavQCxb8QMx1kUDYSENplQ+VEzP+lUev2C2JFXNx0IYM9ITsSJzxiMejlNbRLEDv3W0NlLYaPesZQ2HooKC+BxMo+kUXpLzBvdhFGWf8xjZr/7T9Tw+qXmaCaddcphNk0eOLJr7aFGl6Gyk8ySC0boD1vwGsGieBjsNKXp20z3fnoquyS2JUBfR2riAscxfT7zkJT2LI9BWwyeJv7bOLYJpqxA/zErLHB/As5IvbSopXnBjLAX26A26w+8JLd2bcljehw==\",\"keyLength\":2048,\"publicExponent\":65537,\"version\":0},\"privateKey\":{\"privateExponent\":\"iMx+CU9xpkYiWMz3C3t9hW7MgPhWVJlDyDJL0Gyd2QxT9hVX1ipOdQB1pxJ3amsW7QbM7BySen9nXCg3xIJYnRBecUvaICK+mBx1b5QU6A/64Yt5H6k5X5CKo1j68yydEbcbk8eRlRxTqGBK/UiJNq4OLa3mymPz11iAIu8/oiCZB4B68W/id2ABwPx2+PScSNnMegbs6npQeiz8Qp6tAub7Tv5yb5XYSrEm+uDE7Bp8shlnaX/vfR08ORdE9PmmVhpajFCvzU/MDrIGWWrxp0zvBU27ocfD5wG0fWzQJ9nKBn43jmnJIfiyYi0mcWdTMhUjAgxVRQ3F0SOOMFEmQQ==\",\"primeExponentP\":\"HEsX5ObYwnni1gNoobgw4GDsQCUcO3Ftg8OgQZIGB+dGT3sxTmCtYuk27YtuKBdjXHcw1fxJGAFPGtszw229i8bGEI6+cZP9y/6Si931MdH/znkPWznWMqnmEWeuv2PFmkwmrDOfG37mtUdUJZjhILGj9LPZBn+h5omINnPUBhU=\",\"modulus\":\"69NcPtK4sY5gpnSkcXETEdcO0dF90H8w7l1YK77wh7b8Mrpda/3LpYRYJ/kKXove5bPaf6uFdwh6GEeDRHavQCxb8QMx1kUDYSENplQ+VEzP+lUev2C2JFXNx0IYM9ITsSJzxiMejlNbRLEDv3W0NlLYaPesZQ2HooKC+BxMo+kUXpLzBvdhFGWf8xjZr/7T9Tw+qXmaCaddcphNk0eOLJr7aFGl6Gyk8ySC0boD1vwGsGieBjsNKXp20z3fnoquyS2JUBfR2riAscxfT7zkJT2LI9BWwyeJv7bOLYJpqxA/zErLHB/As5IvbSopXnBjLAX26A26w+8JLd2bcljehw==\",\"keyLength\":2048,\"primeQ\":\"9EBmTJqqOtxzhnpljcb6UbVdIbbnB3OUVnkJnF9pv4AAQs7CTr8uAZW/pBaARuAu1Kj1EsGhzkybssU6cgNMXkDqahFqL6Cqd6LsB95pCi+aqRX5wPzrViB0jlwfkY1L3yeKSeaN/gBmdsCO94B5FXqBuvx6/T7RE5oevsBM2GE=\",\"primeP\":\"9ys1KlbeZg2xyKip+iig0BUtsdVtAv3Hzc7cnq/uUjc4Zianzu3FBO80k8Uo3VByPjF00DIzD00onQzaE0whW2VGelQvPSpcaG7JJKqoSwu520/YSgWlHDCeLRqNyeWNr6nEXOVtgjfnBvZs9MYmaMmgzhqKFBZmLHqIFkAZ/+c=\",\"primeExponentQ\":\"1WZquqUq89BmEulfTva4/6iQnQM7aJQ/1ylbD0eBkfHYyIXy2HBKVtIqJMgP/VyjLeQMcv3ATAk8w310Kebd0z+uT0u11bTvGyW6SMm2RlL/MpnjowyW5KHok/TDFB06W9clCJoqFvDslPZ6Mp4JrI1jSSaMojQ+4Xx3PjuvKCE=\",\"version\":0,\"crtCoefficient\":\"7EcVbqgFwDAaNgeQFIqGTk9Gxi95CdFkCH0t2RJoxF74Rqfp9OKaUNQpRVwI6dQHTW659q9D4jZrGMVjl13zHfe4e6Q1R2xyHsQ+GH2Q8GbLF/2Sx2emAgfVMfiP7NI8kpyHDoXAh0rM0GBJTuUoVIR8TfEVsgbpfPqwSnva9KA=\"}}";
			var generatedKey = JSON.parse(jsonGeneratedKey);
			console.log("generatedKeyB64:" + generatedKey.publicKey.modulus.length + ":" + generatedKey.publicKey.modulus);
						
			var generateKeyHexWithLeadingZero = "00ebd35c3ed2b8b18e60a674a471711311d70ed1d17dd07f30ee5d582bbef087b6fc32ba5d6bfdcba5845827f90a5e8bdee5b3da7fab8577087a1847834476af402c5bf10331d6450361210da6543e544ccffa551ebf60b62455cdc7421833d213b12273c6231e8e535b44b103bf75b43652d868f7ac650d87a28282f81c4ca3e9145e92f306f76114659ff318d9affed3f53c3ea9799a09a75d72984d93478e2c9afb6851a5e86ca4f32482d1ba03d6fc06b0689e063b0d297a76d33ddf9e8aaec92d895017d1dab880b1cc5f4fbce4253d8b23d056c32789bfb6ce2d8269ab103fcc4acb1c1fc0b3922f6d2a295e70632c05f6e80dbac3ef092ddd9b7258de87";
			generatedKey.publicKey.modulus = tutao.util.EncodingConverter.hexToBase64(generateKeyHexWithLeadingZero);
								
			var generatedKeyHex = tutao.util.EncodingConverter.base64ToHex(generatedKey.publicKey.modulus);
			console.log("generatedKeyHex:" + generatedKeyHex.length + ":" + generatedKeyHex);

			var convertedKeyPair = tutao.locator.rsaUtil._convertFromKeyPair(generatedKey);
			console.log("convertedKey:" + convertedKeyPair.publicKey.length + ":" + convertedKeyPair.publicKey);

			var convertedKeyToHex = tutao.locator.rsaUtil.keyToHex(convertedKeyPair.publicKey);
			console.log("convertedKeyHex:" + convertedKeyToHex.length + ":" + convertedKeyToHex);

			var convertedKeyToB64 = tutao.util.EncodingConverter.hexToBase64(convertedKeyToHex);
			console.log("convertedKeyB64:" + convertedKeyToB64.length + ":" + convertedKeyToB64);
*/
			
           tutao.locator.crypto.generateRsaKey(2048)
                .then(function (key) {
                    var time = new Date().getTime() - start;
                    self.details("|took:" + time + " key:" + key);
					console.log(key);
					console.log(JSON.stringify(key));
					var hexKey = tutao.util.EncodingConverter.base64ToHex(key.publicKey.modulus);
					console.log("public key length:" + hexKey.length + ":" + hexKey);
                })
                .caught(function (e) {
                    console.log(e);
                    self.details("could not generate key");
                });
        }),
		new tutao.tutanota.ctrl.DeveloperTest("rsaEnrypt", function () {
            var self = this;
            var start = new Date().getTime();
			
			var publicKeyData = "{\"version\":0,\"keyLength\":2048,\"modulus\":\"ALuBAuRs/7/zgyhR832eUPZKYqWAsWU6QiOfYIJSNle/IDRPhE6+7OWK6kbK6/oS6q/hQBf3s7Pmbvf2iSTb4t7PGu0PehJOgjXHbVKudV5bM3LSaYxm4d7c+O3vvJu0z/+EWcM+OSXHcph300HabaqmRnTBazV6fISVtq453bxkYla63DaYtqLsj6nq29roypMrTOQkZLtOeFqnCVnxtwcjCFvCuty30MBIghtHWizxsh34p5dBUNSxC61TR3qGvg/el6jKHQLQLbOVrrb+2jElKpKgclhElloHLtKFCHeEewlsBUMvwSQqy9isKz24csF232SM0QFbcOOBSRdQROE=\"}";
			var publicKey = JSON.parse(publicKeyData);
						
												
			var data = [124, 129, 188, 0, 59, 219, 80, 46, 237, 6, 87, 181, 10, 38, 72, 47];
			
			
			tutao.locator.crypto.rsaEncrypt(publicKey, data)
                .then(function (result) {
                    var time = new Date().getTime() - start;
					developerViewModel.encryptedData = result;
					console.log(result);
                    self.details("|took:" + time + " value: " + result.length);
                })
                .caught(function (e) {
                    console.log(e);
                    self.details("could encrypt data");
                });
        }),
        new tutao.tutanota.ctrl.DeveloperTest("rsaDecrypt", function () {
            var self = this;
            var start = new Date().getTime();
			var bytes = [174, 183, 123, 39, 229, 50, 77, 74, 120, 51, 112, 248, 91, 38, 57, 131, 163, 232, 178, 16, 51, 167, 97, 112, 95, 23, 166, 119, 69, 178, 94, 70, 50, 23, 5, 105, 64, 244, 244, 200, 153, 126, 44, 138, 71, 81, 171, 16, 198, 54, 133, 217, 117, 251, 1, 11, 69, 237, 136, 206, 109, 118, 182, 171, 187, 202, 21, 0, 173, 209, 244, 203, 233, 114, 160, 79, 136, 141, 227, 66, 12, 107, 164, 215, 210, 134, 255, 132, 74, 194, 190, 110, 105, 5, 214, 44, 4, 234, 90, 251, 106, 58, 26, 180, 161, 118, 217, 75, 23, 14, 29, 74, 131, 82, 226, 176, 21, 83, 172, 251, 38, 253, 228, 65, 142, 183, 114, 231, 199, 235, 244, 184, 170, 37, 144, 47, 234, 90, 8, 38, 39, 173, 9, 45, 104, 217, 59, 202, 182, 143, 34, 119, 42, 31, 4, 27, 168, 81, 24, 92, 254, 224, 187, 95, 237, 166, 200, 216, 222, 195, 217, 102, 79, 170, 90, 13, 140, 121, 103, 254, 229, 158, 105, 175, 115, 2, 59, 135, 127, 115, 47, 222, 222, 143, 242, 190, 181, 11, 112, 71, 91, 144, 150, 207, 178, 255, 44, 130, 164, 146, 125, 67, 106, 79, 184, 84, 184, 243, 95, 62, 57, 200, 31, 141, 82, 233, 93, 169, 215, 94, 100, 161, 123, 35, 185, 181, 186, 20, 68, 19, 243, 246, 223, 119, 213, 201, 192, 252, 43, 177, 222, 158, 226, 47, 131, 41];
			
			var keyData = "{\"version\":0,\"keyLength\":2048,\"modulus\":\"ALuBAuRs/7/zgyhR832eUPZKYqWAsWU6QiOfYIJSNle/IDRPhE6+7OWK6kbK6/oS6q/hQBf3s7Pmbvf2iSTb4t7PGu0PehJOgjXHbVKudV5bM3LSaYxm4d7c+O3vvJu0z/+EWcM+OSXHcph300HabaqmRnTBazV6fISVtq453bxkYla63DaYtqLsj6nq29roypMrTOQkZLtOeFqnCVnxtwcjCFvCuty30MBIghtHWizxsh34p5dBUNSxC61TR3qGvg/el6jKHQLQLbOVrrb+2jElKpKgclhElloHLtKFCHeEewlsBUMvwSQqy9isKz24csF232SM0QFbcOOBSRdQROE=\",\"privateExponent\":\"A8DxbeFAvXcCiSwa08j3lfanQujwpDYmXNAz/mfm7prE6kctPuZTl8TQK9qkHr2CNUMtJU2wK0nRruUgmbxNLmi3AUfuCa/Iq4ryhVU4xErPHN1Zf5YPr4Z89UZ3YCaeg18C7QWx3y+++45qjEbzKxdpEa1NmCR7mavlnFdMORlAg7jl0Cbod5AglxFnd2kFMJ9tPfgkqRArue8nrYcQhhozZNODy4jvpepfSOaRBjaun6qo554FbAuKZUrh3Z77m2T5bY0+4eCtZvX0ZvKul/DUEnE1yisVAjqX7q39RtjZFAaAyj0yapoZFiZct/8ggdp3jEa8ww2Vg2fuFrYYAQ==\",\"primeP\":\"APtv+YE6+spjBHPa15h7IqaiZsbbrllrqKZpK1XKyG97fLxAZPhEobtyT7DbnZXxaSyMB5Y5LXCp0gs7AZ3aGUNQBh+JpuRctOw/FwF7ZCfMvlA14VBMA1ImokgIo864uD9DdAYX+n0o2Xg7JcryDJYqwWcaxcyZIHeGBaKPOoI5\",\"primeQ\":\"AL7oCmvy5AvEeT/eS76IQ66L9uQzHh3OtH7NBMCxv4NqVmVFubyJHURboGNXfz6d7povWYqt5Z/DqKv9xuZoESRuj7kwkS90PbzXvgVAd0YsUcb+DrKPNPBuyfF3jbjNNmT4AGxK0gQFXRg/+VQgxkzJpAaVCe/D3sQZTIeTwbfp\",\"primeExponentP\":\"ALyNWfO5QPyoiFxBDlBAdtmzC5Owhex0uYIhd+fcK7a+Sen5+D3dadNhg7VC28fnw1EuqTnUIulL0EGvvCSduzgpOI5J8adqhhprrVrlJ1RZS5Zm8VH/zrW6VxPhtsV87F40vTscnDFjgsGQyWSJYzrxURt6jj5BzoETNgKTmfKx\",\"primeExponentQ\":\"AIboYZ0Ba2hpcqnQxMQjdXjezh1bhlfYIDNPXKFzuvv6ZI1ypZv3ZWhOO9yYE4LDhr8M4QEgfJnXYdYRI8LlHeAaBZUAHkljotFVwKHjeaZsYWn3VZmXm/igwjLSoqNK2bqmi137zcgrpish4mcyNhBDmpdQMVJvn3gCzNMudoIp\",\"crtCoefficient\":\"N+GN/tVqQ9HVWB5b+xi3uWYkhhKe3IA8nomzUuEg9sQKFBH0NFmaq9L57Y4eVbY1bSxPsuHYt8Zh1xxdCnPardV2wW0BvP4Dmab5Y+6QxJVabNFvRsxpCGhKujIQ5m5wWTDRZVrACGnAveQZzz6g0gs80RKP9tlweJk6rifejvI=\"}";
			var privateKey = JSON.parse(keyData);
			
			bytes = developerViewModel.encryptedData;
			
			tutao.locator.crypto.rsaDecrypt(privateKey, bytes)
                .then(function () {
                    var time = new Date().getTime() - start;
                    self.details("|took:" + time);
                })
                .caught(function (e) {
                    console.log(e);
                    self.details("could not decrypt data");
                });
        }),

        new tutao.tutanota.ctrl.DeveloperTest("bycrpt", function () {
            var self = this;
			var salt = tutao.locator.kdfCrypter.generateRandomSalt();
            var start = new Date().getTime();
			self.details("starting native bcrypt");
			
			tutao.locator.crypto.generateKeyFromPassphrase("arm", salt).then(function(nativeKey){
                var time = new Date().getTime() - start;
				self.details("starting browser bcrypt");
				console.log("native took:" + time + "[ms]:" + nativeKey);
				start = new Date().getTime();
				tutao.locator.kdfCrypter.generateKeyFromPassphrase("arm", salt).then(function(browserKey){
	                var browserTime = new Date().getTime() - start;
					self.details("finished browser bcrypt");
					console.log("browser took:" + browserTime + "[ms]:"+ browserKey);
				});
			})
			.caught(function (e) {
				console.log(e);
                self.details("could not bcrypt data");
            });
        }),
		
        new tutao.tutanota.ctrl.DeveloperTest("Create notification", function () {
            var self = this;
            tutao.locator.notification.add("Title", "message", 1).then(function () {
                console.log("user clicked on notification");
            });
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Increase Badge", function () {
            tutao.locator.notification.updateBadge(self.badge++);
        }),
        new tutao.tutanota.ctrl.DeveloperTest("Decrease Badge", function () {
            tutao.locator.notification.updateBadge(self.badge--);
        }),

        new tutao.tutanota.ctrl.DeveloperTest("run tests", function () {
            var self = this;
            self.details("forwarding...");
            var locationArray = location.href.split('/')
            var rootFolder = locationArray.slice(0, locationArray.length - 1).join('/') + ('/');
            location.href = rootFolder + "test/index.html";
        })
    ];
};

/**
 */
tutao.tutanota.ctrl.DeveloperViewModel.prototype.open = function() {
    this.showDialog(true);
};

tutao.tutanota.ctrl.DeveloperViewModel.prototype.close = function() {
    this.showDialog(false);
};