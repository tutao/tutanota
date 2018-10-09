// Copyright (c) 2012 Jay Jordan
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// 	copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// 	The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// 	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// 	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// 	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

const exec = require('child_process').exec

/**
 * open a file or uri using the default application for the file type.
 *
 * @return {ChildProcess} - the child process object.
 * @param {string} target - the file/uri to open.
 * @param {string} appName - (optional) the application to be used to open the
 *      file (for example, "chrome", "firefox")
 * @param {function(Error)} callback - called with null on success, or
 *      an error object that contains a property 'code' with the exit
 *      code of the process.
 */

module.exports = open;

function open(target, appName, callback) {
	let opener;

	if (typeof(appName) === 'function') {
		callback = appName;
		appName = null;
	}

	switch (process.platform) {
		case 'darwin':
			if (appName) {
				opener = 'open -a "' + escape(appName) + '"';
			} else {
				opener = 'open';
			}
			break;
		case 'win32':
			// if the first parameter to start is quoted, it uses that as the title
			// so we pass a blank title so we can quote the file we are opening
			if (appName) {
				opener = 'start "" "' + escape(appName) + '"';
			} else {
				opener = 'start ""';
			}
			break;
		default:
			if (appName) {
				opener = escape(appName);
			} else {
				// use Portlands xdg-open everywhere else.
				// requires xdg-utils. can't package the script because
				// we can't execute it from the app.asar archive
				opener = 'xdg-open';
			}
			break;
	}

	// if (process.env.SUDO_USER) {
	// 	opener = 'sudo -u ' + process.env.SUDO_USER + ' ' + opener;
	// }

	return exec(opener + ' "' + escape(target) + '"', callback)
}

function escape(s) {
	return s.replace(/"/g, '\\\"');
}
