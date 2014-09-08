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
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Info;
using System.IO.IsolatedStorage;
using System.Windows.Resources;
using System.IO;
using System.Diagnostics;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class Device : BaseCommand
    {
        public void getDeviceInfo(string notused)
        {

            string res = String.Format("\"name\":\"{0}\",\"platform\":\"{1}\",\"uuid\":\"{2}\",\"version\":\"{3}\",\"model\":\"{4}\"",
                                        this.name,
                                        this.platform,
                                        this.uuid,
                                        this.version,
                                        this.model);

            res = "{" + res + "}";
            //Debug.WriteLine("Result::" + res);
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, res));
        }

        public string model
        {
            get
            {
                return DeviceStatus.DeviceName;
                //return String.Format("{0},{1},{2}", DeviceStatus.DeviceManufacturer, DeviceStatus.DeviceHardwareVersion, DeviceStatus.DeviceFirmwareVersion); 
            }
        }

        public string name
        {
            get
            {
                return DeviceStatus.DeviceName;
                
            }
        }

        public string platform
        {
            get
            {
                return Environment.OSVersion.Platform.ToString();
            }
        }

        public string uuid
        {
            get
            {
                string returnVal = "";
                object id;
                UserExtendedProperties.TryGetValue("ANID", out id);

                if (id != null)
                {
                    returnVal = id.ToString().Substring(2, 32);
                }
                else
                {
                    returnVal = "???unknown???";

                    using (IsolatedStorageFile appStorage = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        try
                        {
                            IsolatedStorageFileStream fileStream = new IsolatedStorageFileStream("DeviceID.txt", FileMode.Open, FileAccess.Read, appStorage);

                            using (StreamReader reader = new StreamReader(fileStream))
                            {
                                returnVal = reader.ReadLine();
                            }
                        }
                        catch (Exception /*ex*/)
                        {

                        }
                    }
                }

                return returnVal;
            }
        }

        public string version
        {
            get
            {
                return Environment.OSVersion.Version.ToString();
            }
        }

    }
}
