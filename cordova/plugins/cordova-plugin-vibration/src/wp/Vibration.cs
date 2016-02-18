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

using System;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Devices;
using System.Runtime.Serialization;
using System.Threading;
using System.Windows.Resources;
using Microsoft.Phone.Controls;
using System.Diagnostics;
using System.Threading.Tasks;


namespace WPCordovaClassLib.Cordova.Commands
{
    public class Vibration : BaseCommand
    {

        private static readonly int DEFAULT_DURATION = 200;
        private static readonly int MAX_DURATION = 5000;
        private static readonly int MIN_DURATION = 5;

        // bool used to determine if cancel was called during vibrateWithPattern
        private bool cancelWasCalled = false;

        public void vibrate(string vibrateDuration)
        {
            int msecs = DEFAULT_DURATION; // set default
            string callbackId = CurrentCommandCallbackId;

            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(vibrateDuration);
                msecs = int.Parse(args[0]);
                callbackId = args[1];

                if (msecs < MIN_DURATION)
                {
                    msecs = MIN_DURATION;
                }
                else if (msecs > MAX_DURATION)
                {
                    msecs = MAX_DURATION;
                }
            }
            catch (FormatException)
            {
                 DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), callbackId);
            }

            vibrateMs(msecs);

            // TODO: may need to add listener to trigger DispatchCommandResult when the vibration ends...
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK),callbackId);
        }

        private static void vibrateMs(int msecs)
        {
            VibrateController.Default.Start(TimeSpan.FromMilliseconds(msecs));
        }

        public async Task vibrateWithPattern(string options)
        {
            string callbackId = CurrentCommandCallbackId;
            // clear the cancelWasCalled flag
            cancelWasCalled = false;
            // get options
            try
            {
                string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                int[] pattern = JSON.JsonHelper.Deserialize<int[]>(args[0]);
                callbackId = args[1];

                for (int i = 0; i < pattern.Length && !cancelWasCalled; i++)
                {
                    int msecs = pattern[i];
                    if (msecs < MIN_DURATION)
                    {
                        msecs = MIN_DURATION;
                    }
                    if (i % 2 == 0)
                    {
                        msecs = (msecs > MAX_DURATION) ? MAX_DURATION : msecs;
                        VibrateController.Default.Start(TimeSpan.FromMilliseconds(msecs));
                    }
                    await Task.Delay(TimeSpan.FromMilliseconds(msecs));
                }
                DispatchCommandResult(new PluginResult(PluginResult.Status.OK), callbackId);
            }
            catch (FormatException)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION), callbackId);
            }
        }

        public void cancelVibration(string options)
        {
            string callbackId = JSON.JsonHelper.Deserialize<string[]>(options)[0];
            VibrateController.Default.Stop();
            cancelWasCalled = true;
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK), callbackId);
        }
    }
}
