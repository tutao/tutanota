<!---
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->

# 플러그인 개발자를 위한 노트

이 노트는 주로 파일 플러그인을 사용 하 여 파일 시스템 플러그인 인터페이스를 작성 하 고 싶은 안 드 로이드와 iOS 개발자를 위한 것입니다.

## 코르 도우 바 파일 시스템 Url 사용

버전 1.0.0, 이후이 플러그인과 Url 사용 하고있다는 `cdvfile` 교량, 모든 통신에 대 한 제도 보다는 자바 원시 장치 파일 시스템 경로 노출.

자바 스크립트 측면에서 즉 그 FileEntry 및 DirectoryEntry 개체 fullPath 속성을 HTML 파일 시스템의 루트에 상대적입니다. FileEntry 또는 DirectoryEntry 개체를 수락 하는 플러그인의 자바 API를 호출 해야 `.toURL()` 다리에 걸쳐 네이티브 코드에 전달 하기 전에 해당 개체에.

### Cdvfile 변환: / / fileystem 경로 Url

플러그인 파일 시스템을 작성 하는 실제 파일 시스템 위치에 받은 파일 시스템 URL을 변환 할 수 있습니다. 이렇게, 네이티브 플랫폼에 따라 여러 방법이 있다.

기억 하는 것이 중요 하다 모든 `cdvfile://` Url은 실제 파일 장치에 매핑. 일부 Url 파일에 의해 표현 되지 않는 또는 심지어 원격 리소스를 참조할 수 있는 장치에 자산을 참조할 수 있습니다. 이러한 가능성 때문에 플러그인 경로를 Url을 변환 하려고 할 때 다시 의미 있는 결과 얻을 지 여부를 항상 테스트 해야 합니다.

#### 안 드 로이드

안 드 로이드, 변환 하는 간단한 방법에는 `cdvfile://` URL을 파일 시스템 경로 사용 하는 `org.apache.cordova.CordovaResourceApi` . `CordovaResourceApi`처리할 수 있는 여러 가지 방법에는 `cdvfile://` Url:

    webView 플러그인 클래스 CordovaResourceApi resourceApi의 멤버인 = webView.getResourceApi();
    
    장치에이 파일을 나타내는 file:/// URL 얻기 / / 같은 URL 변경 파일 Uri fileURL에 매핑할 수 없는 경우 또는 = resourceApi.remapUri(Uri.parse(cdvfileURL));
    

그것은 또한 파일 플러그인을 직접 사용할 수 있습니다:

    가져오기 org.apache.cordova.file.FileUtils;
    가져오기 org.apache.cordova.file.FileSystem;
    가져오기 java.net.MalformedURLException;
    
    플러그인 관리자에서 파일 플러그인을 얻을 FileUtils filePlugin = (FileUtils)webView.pluginManager.getPlugin("File");
    
    그것 시도 대 한 경로 얻을 URL을 감안할 때, {문자열 경로 = filePlugin.filesystemPathForURL(cdvfileURL);} catch (MalformedURLException e) {/ / 파일 시스템 url 인식 되지 않았습니다}
    

경로를 변환 하는 `cdvfile://` URL:

    가져오기 org.apache.cordova.file.LocalFilesystemURL;
    
    장치 경로 대 한 LocalFilesystemURL 개체를 가져오기 / / cdvfile URL로 나타낼 수 없는 경우 null.
    LocalFilesystemURL url = filePlugin.filesystemURLforLocalPath(path);
    URL 개체 문자열 cdvfileURL의 문자열 표현을 = url.toString();
    

플러그인 파일을 만들고 그것에 대 한 FileEntry 개체를 반환 하려면, 파일 플러그인을 사용.

    JSON 구조를 JavaScript에 반환을 위한 적당 한 반환 / /이 파일은 cdvfile URL로 표현 하는 경우 null.
    JSONObject 항목 = filePlugin.getEntryForFile(file);
    

#### iOS

IOS에서 코르도바 같은 사용 하지 않는 `CordovaResourceApi` 안 드 로이드 개념. Ios, Url 및 파일 시스템 경로 사이 변환 파일 플러그인을 사용 해야 합니다.

    URL 문자열 CDVFilesystemURL * url에서 CDVFilesystem URL 개체를 가져오기 = [CDVFilesystemURL fileSystemURLWithString:cdvfileURL];
    파일 NSString * 경로에 매핑할 수 없는 경우 URL 개체 또는 없음에 대 한 경로 얻을 = [filePlugin filesystemPathForURL:url];
    
    
    장치 경로 대 한 CDVFilesystem URL 개체를 가져오기 또는 / / 없음 cdvfile URL로 나타낼 수 없는 경우.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    URL 개체 NSString * cdvfileURL의 문자열 표현을 = [url absoluteString];
    

플러그인 파일을 만들고 그것에 대 한 FileEntry 개체를 반환 하려면, 파일 플러그인을 사용.

    장치 경로 대 한 CDVFilesystem URL 개체를 가져오기 또는 / / 없음 cdvfile URL로 나타낼 수 없는 경우.
    CDVFilesystemURL * url = [filePlugin fileSystemURLforLocalPath:path];
    자바 스크립트 NSDictionary * 항목으로 돌아가려면 구조를 얻을 = [filePlugin makeEntryForLocalURL:url]
    

#### 자바 스크립트

자바 스크립트에는 `cdvfile://` FileEntry 또는 DirectoryEntry 개체에서 URL 호출 `.toURL()` 그것에:

    var cdvfileURL = entry.toURL();
    

플러그인 응답 처리기에서 실제 항목 개체로 반환 된 FileEntry 구조에서 변환 처리기 코드 해야 파일 플러그인 가져오고 새 개체를 만들:

    적절 한 항목 개체 var 항목;
    경우 (entryStruct.isDirectory) {항목 = 새 DirectoryEntry (entryStruct.name, entryStruct.fullPath, 새로운 FileSystem(entryStruct.filesystemName));} 다른 {항목 = 새로운 FileEntry (entryStruct.name, entryStruct.fullPath, 새로운 FileSystem(entryStruct.filesystemName));}