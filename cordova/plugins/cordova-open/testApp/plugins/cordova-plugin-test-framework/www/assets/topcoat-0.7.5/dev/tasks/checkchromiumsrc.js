var chromiumSrc = process.env.CHROMIUM_SRC;

module.exports = function(grunt) {

    grunt.registerTask('check_chromium_src', "Internal task to store CHROMIUM_SRC env var into chromiumSrc", function() {
        if (!chromiumSrc) {
            grunt.fail.warn("Please set the CHROMIUM_SRC env var to the root of your chromium sources(ends in /src)");
        } else {
            grunt.log.writeln("CHROMIUM_SRC points to " + chromiumSrc.cyan);
        }
    });

}
