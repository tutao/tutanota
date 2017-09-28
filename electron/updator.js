var path = require('path');
var fs = require('fs');

var new_files_list = [];
var old_files_list = [];
var files_updated = 0;

function LoadTutanota()
{
    //Open Application
    window.location.href = "index.html";
}

//Saves the content downloaded to a file
function SaveFile(data, full_path)
{
    //Remove existing file if it exists  
    fs.unlink(full_path, function(err){  
        // Ignore error if no file already exists  
        if (err && err.code !== 'ENOENT')  
        {
            throw err;
        }                        
        //Save the downloaded file
        fs.writeFile(full_path, data, 'base64', function(err) {  
            if (err)
            {
                throw err;  
            }
            console.log('Downloaded:' + full_path ); 
            $(".message_log").html("<span>Updating: " + files_updated + "/" + new_files_list.length + "</span>");
            files_updated++;
            if (files_updated + 1 == new_files_list.length)
            {
                LoadTutanota();
            }
        });  
    });
}

//Converts blob to base64
function blobToBase64(blob, cb)
{
    var reader = new FileReader();
    reader.onload = function() {
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        cb(base64);
    };
    reader.readAsDataURL(blob);
}

//Downloads the new file contents
function DownloadFile(file_path)
{
    var full_path = path.join(__dirname, file_path);
    var file_ext = path.extname(file_path);
    //Create Dir if does not exist
    var file_dir = path.dirname(full_path);
    if (file_dir != "" && !fs.existsSync(file_dir))
    {
        fs.mkdirSync(file_dir);
    }
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200)
        {
            var blob = new Blob([this.response], {type: "octet/stream"});
            blobToBase64(blob, (data) => {
                SaveFile(data, full_path);
            });
        }
    }
    xhr.open('GET', 'https://raw.githubusercontent.com/zeeshan595/tutanota/tutanota-latest-electron-build/' + file_path);
    xhr.responseType = 'blob';
    xhr.send();
}

//Compares the 2 lists
function CompareFiles()
{
    $(".message_log").html("<span>Comparing files...</span>");
    var update_required = false;
    for (var i = 0; i < new_files_list.length; i++)
    {                
        var frequired = true;
        for (var j = 0; j < old_files_list.length; j++)
        {
            if (new_files_list[i].file == old_files_list[i].file)
            {
                if (new_files_list[i].size == old_files_list[i].size)
                {
                    frequired = false;
                }
            }
        }

        if (frequired)
        {
            update_required = true;
            DownloadFile(new_files_list[i].file);
        }
    }
    if (!update_required)
        LoadTutanota();
}

//Gets server file list and current client file list
$(".message_log").html("<span>Checking for updates...</span>");
$.ajax({
    dataType: "json",
    url: "https://raw.githubusercontent.com/zeeshan595/tutanota/tutanota-latest-electron-build/md5sum.json",
    success: function(data){
        new_files_list = data['md5sum'];
        $.ajax({
            dataType: "json",
            url: path.join(__dirname, 'md5sum.json'),
            success: function(data){
                old_files_list = data['md5sum'];
                CompareFiles();
            },
            error: function (request, status, error) {
                old_files_list = [];
                CompareFiles();
            }
        });
    },
    error: function (request, status, error) {
        new_files_list = [];
        alert("ERROR: Could not get file list from server.");
        console.log(error);
    }
});