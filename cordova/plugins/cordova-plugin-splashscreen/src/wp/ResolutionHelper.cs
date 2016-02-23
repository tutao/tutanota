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

using Microsoft.Phone.Info;
using System;
using System.Windows;

namespace WPCordovaClassLib.Cordova.Commands
{
    public enum Resolutions { WVGA, WXGA, HD };

    public static class ResolutionHelper
    { 
       public static Resolutions CurrentResolution
        {
            get
            {
                switch (Application.Current.Host.Content.ScaleFactor) 
                {
                    case 100: return Resolutions.WVGA;
                    case 160: return Resolutions.WXGA;
                    case 150: return Resolutions.HD;
                }
                throw new InvalidOperationException("Unknown resolution");
            }
        }
    }
}