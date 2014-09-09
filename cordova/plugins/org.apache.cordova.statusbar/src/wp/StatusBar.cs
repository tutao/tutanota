/*  
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/


using Microsoft.Phone.Shell;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Threading;
using System.Windows;
using System.Windows.Media;
using System.Windows.Threading;


/*
 *   http://www.idev101.com/code/User_Interface/StatusBar.html
 *   https://developer.apple.com/library/ios/documentation/userexperience/conceptual/transitionguide/Bars.html
 *   https://developer.apple.com/library/ios/documentation/uikit/reference/UIApplication_Class/Reference/Reference.html#//apple_ref/c/econst/UIStatusBarStyleDefault
 * */


namespace WPCordovaClassLib.Cordova.Commands
{
    public class StatusBar : BaseCommand
    {

        // returns an argb value, if the hex is only rgb, it will be full opacity
        protected Color ColorFromHex(string hexString)
        {
            string cleanHex = hexString.Replace("#", "").Replace("0x", "");
            // turn #FFF into #FFFFFF
            if (cleanHex.Length == 3)
            {
                cleanHex = "" + cleanHex[0] + cleanHex[0] + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2];
            }
            // add an alpha 100% if it is missing
            if (cleanHex.Length == 6)
            {
                cleanHex = "FF" + cleanHex;
            }
            int argb = Int32.Parse(cleanHex, NumberStyles.HexNumber);
            Color clr = Color.FromArgb((byte)((argb & 0xff000000) >> 0x18),
                              (byte)((argb & 0xff0000) >> 0x10),
                              (byte)((argb & 0xff00) >> 8),
                              (byte)(argb & 0xff));
            return clr;
        }

        public void _ready(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                bool isVis = SystemTray.IsVisible;
                // TODO: pass this to JS
                //Debug.WriteLine("Result::" + res);
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, isVis));
            });
        }

        public void overlaysWebView(string options)
        {    //exec(null, null, "StatusBar", "overlaysWebView", [doOverlay]);
             // string arg = JSON.JsonHelper.Deserialize<string[]>(options)[0];
        }

        public void styleDefault(string options)
        {    //exec(null, null, "StatusBar", "styleDefault", []);
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                SystemTray.ForegroundColor = Colors.Black;
            });
        }

        public void styleLightContent(string options)
        {    //exec(null, null, "StatusBar", "styleLightContent", []);
            
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                SystemTray.ForegroundColor = Colors.White;
            });
        }

        public void styleBlackTranslucent(string options)
        {    //exec(null, null, "StatusBar", "styleBlackTranslucent", []);
            styleLightContent(options);
        }

        public void styleBlackOpaque(string options)
        {    //exec(null, null, "StatusBar", "styleBlackOpaque", []);
            styleLightContent(options);
        }

        public void backgroundColorByName(string options)
        {    //exec(null, null, "StatusBar", "backgroundColorByName", [colorname]);
             // this should NOT be called, js should now be using/converting color names to hex 
        }

        public void backgroundColorByHexString(string options)
        {    //exec(null, null, "StatusBar", "backgroundColorByHexString", [hexString]);
            string argb = JSON.JsonHelper.Deserialize<string[]>(options)[0];

            Color clr = ColorFromHex(argb);
              
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                SystemTray.Opacity = clr.A / 255.0d;
                SystemTray.BackgroundColor = clr;
                
            });
        }

        public void hide(string options)
        {    //exec(null, null, "StatusBar", "hide", []);
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                SystemTray.IsVisible = false;
            });

        }

        public void show(string options)
        {    //exec(null, null, "StatusBar", "show", []);
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                SystemTray.IsVisible = true;
            });
        }
	}
}