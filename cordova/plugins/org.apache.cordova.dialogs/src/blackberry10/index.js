/*
* Copyright 2013 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

function showDialog(args, dialogType, result) {
    //Unpack and map the args
    var msg = JSON.parse(decodeURIComponent(args[0])),
    title = JSON.parse(decodeURIComponent(args[1])),
    btnLabel = JSON.parse(decodeURIComponent(args[2]));

    if (!Array.isArray(btnLabel)) {
        //Converts to array for (string) and (string,string, ...) cases
        btnLabel = btnLabel.split(",");
    }

    if (msg && typeof msg === "string") {
        msg = msg.replace(/^"|"$/g, "").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } else {
        result.error("message is undefined");
        return;
    }

    var messageObj = {
        title : title,
        htmlmessage :  msg,
        dialogType : dialogType,
        optionalButtons : btnLabel
    };

    //TODO replace with getOverlayWebview() when available in webplatform
    qnx.webplatform.getWebViews()[2].dialog.show(messageObj, function (data) {
        if (typeof data === "number") {
            //Confirm dialog call back needs to be called with one-based indexing [1,2,3 etc]
            result.callbackOk(++data, false);
        } else {
            //Prompt dialog callback expects object
            result.callbackOk({
                buttonIndex: data.ok ? 1 : 0,
                input1: (data.oktext) ? decodeURIComponent(data.oktext) : ""
            }, false);
        }
    });

    result.noResult(true);
}

module.exports = {
    alert: function (success, fail, args, env) {
        var result = new PluginResult(args, env);

        if (Object.keys(args).length < 3) {
            result.error("Notification action - alert arguments not found.");
        } else {
            showDialog(args, "CustomAsk", result);
        }
    },
    confirm: function (success, fail, args, env) {
        var result = new PluginResult(args, env);

        if (Object.keys(args).length < 3) {
            result.error("Notification action - confirm arguments not found.");
        } else {
            showDialog(args, "CustomAsk", result);
        }
    },
    prompt: function (success, fail, args, env) {
        var result = new PluginResult(args, env);

        if (Object.keys(args).length < 3) {
            result.error("Notification action - prompt arguments not found.");
        } else {
            showDialog(args, "JavaScriptPrompt", result);
        }
    }
};
