const axios = require('axios');
const fs = require('fs');
const path = require('path');

function file2StringArray(filename) {
    try {
        if (! fs.existsSync(filename)) { return null; };
        var content = fs.readFileSync(filename,"utf-8");
        return content.split("\r\n"); // Windows format
    } catch (err) {
        console.log(String(err));
        return null;
    }
};
async function upload(host,fn) {
    try {
        return await require('request-promise').post({url:host,
            formData: {file: require('fs').createReadStream(fn)}} );
    } catch (error) {
        return {error:error.message};
    }
}
// returns {status, data}
async function api(host,cmd,fname=null) {
    try {

        if (fname != null) {
            var options = {
                method: 'POST',
                uri: 'http://'+host+'/poly/com.polypaths.ent.gui.pprequest.polyAPI?'+cmd,
                formData: {
                    file: {
                        value: fs.createReadStream(fname),
                        options: {filename: fname }
                    }
                },
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'UserName': process.env.PP_API_USER,
                    'Password': process.env.PP_API_PASSWORD,
                    'PostFile': 'True'
                }
            };
            var rp = require('request-promise');
            let ret = await rp(options).promise();
            return {status:200, data:ret};
        } else {
            let axiosConfig = {headers: { UserName: process.env.PP_API_USER,Password: process.env.PP_API_PASSWORD }};
            let form = null;
            try {
                let ret = await axios.post('http://'+host+'/poly/com.polypaths.ent.gui.pprequest.polyAPI?'+cmd, form, axiosConfig);
                return {status:ret.status, data:ret.data}; //ret.data.trim()
            } catch (e) {
                if (e.response == undefined)
                    return {status:-1, data:e.errno};
                else
                    return {status:e.response.status, data:e.response.data};
            }
        }
    } catch (error) {
        return {status:error.status, data:"ERROR"+","+error.message};
    }
};

async function batch(host,cmd_array){
    var check_status = false;
    for (var i=0; i<cmd_array.length; i++) {
        var arr = cmd_array[i].split(" ");
        if (arr[0] === "cmd") {
            var cmd = arr.slice(1).join(' ');
            const execSync = require('child_process').execSync;
            execSync(cmd,{stdio: 'inherit'});
        } else if (arr[0] === "comment" || arr[0] === "//") {
        } else if (arr[0] === "check-on") {
            check_status = true;
            console.log("Check On (exit if failed)");
        } else if (arr[0] === "check-off") {
            check_status = false;
            console.log("Check Off (continue to run)");
        } else {
            //console.log(`Running "${cmd_array[i]}" on "${host}"`);
            var fname = null;
            for (var a=0;a<arr.length;a++) {
                if (arr[a] == "job_file" || arr[a] == "in_file" || arr[a] == "filter_file") {
                    fname = arr[a+1];
                }
            }
            var ret = await api(host,cmd_array[i],fname);
            console.log(ret.data);
            if (check_status && ret.status !== 200) {
                process.exit(ret.status);
            }
        }
    }
    process.exit(0);
};

const version = "Polyapi v1.04 12/5/2019";
async function main() {
    var args = process.argv.slice(2);
    if (process.env.PP_API_HOST==undefined || process.env.PP_API_USER==undefined || 
        process.env.PP_API_PASSWORD==undefined) {
        console.log(version);
        console.log("Environment variables PP_API_HOST, PP_API_USER and PP_API_PASSWORD need to be set.");
    } else if (args.length < 1) {
        console.log(version);
        console.log("Usage: polyapi.exe <command|batch file|report file>");
    } else {
        var host = process.env.PP_API_HOST ; //args[0];
        var cmd_array = file2StringArray(args[0]);

        if (args.length > 2 && args[1].toUpperCase() === "REPORT") {
            var command = args.slice(1).join(' ');
            var ret = await api(host,command);
            if (ret.status != 200 || (ret.data != undefined && ret.data.includes("ERROR:"))) {
                console.log(ret.data.trim());
                process.exit(-1);
            } else {
                try{
                    var fs = require("fs");
                    fs.writeFileSync(args[0],ret.data,'utf8');
                    process.exit(0);
                } catch (error) {
                    console.log(error.message);
                    process.exit(-3);
                }
            }
        } else if (cmd_array !== null) {
            console.log(`Running "${args[0]}" in batch mode on "${host}"`);
            await batch(host,cmd_array);
            console.log("Batch finished.");
        } else {

            var fname = null;
            for (var a=0;a<args.length;a++) {
                if (args[a] == "job_file" || args[a] == "in_file" || args[a] == "filter_file") {
                    fname = args[a+1];
                    args[a+1] = path.basename(fname);
                }
            }
            var command = args.join(' '); // args.slice(1).join(' ');
            var ret = await api(host,command,fname);

            var msg = "",ret_number=0;
            if (ret.data != undefined) {
                if (typeof ret.data == "number") {
                    ret_number = ret.data;
                    console.log(ret_number);
                    process.exit(ret_number);
                } else {
                    msg = ret.data.trim();
                    console.log(msg);
                }
            }
            if (msg.includes("ERROR:") || msg.includes("not supported"))
                    process.exit(-1);
            if (ret.status == 200) {
                if (msg.includes("ERROR:") || msg.includes("not supported"))
                    process.exit(-1);
                else if (msg.includes("Finished"))
                    process.exit(1);
                else if (msg.startsWith("Running") || msg.startsWith("Waiting") 
                    || msg.startsWith("Scheduled") || msg.startsWith("Pending"))
                    process.exit(2);
                else if (msg.includes("Failed") || msg.includes("Killed"))
                    process.exit(-2);
                else
                    process.exit(0); // Successful
            } else {
                process.exit(-3); // System Error
            }
        }
    }
};

main();