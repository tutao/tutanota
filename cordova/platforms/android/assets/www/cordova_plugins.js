cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/de.tutanota.native/www/telephone.js",
        "id": "de.tutanota.native.telephone",
        "clobbers": [
            "tutao.native.device.Phone"
        ]
    },
    {
        "file": "plugins/de.tutanota.native/www/crypto.js",
        "id": "de.tutanota.native.crypto",
        "clobbers": [
            "tutao.native.device.Crypto"
        ]
    },
    {
        "file": "plugins/de.tutanota.native/www/fileUtil.js",
        "id": "de.tutanota.native.fileUtil",
        "clobbers": [
            "tutao.native.device.FileUtil"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "android.support.v4": "1.0.0",
    "de.tutanota.native": "0.0.1"
}
// BOTTOM OF METADATA
});