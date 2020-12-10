# polyapi.exe - A Command Line Tool for Enterprise

polyapi.exe is a standalone command line tool on Windows (or Linux) that allows users to interact with Polypaths Enterprise through their scripts. 

polyapi.exe is a wrapper of Polypaths' Web Service API. You can run a report that output a csv to your local drive, you can also create or update a job from a xml file in your local drive (or created in-memory). And of course you can launch a job, query various status of the system, and manage the grid (restart the farm, stop/start any calc or calc central) all from your script that runs anywhere that has http access to yout internal Polypaths Enterprise server.

## Getting Started
```
git clone https://github.com/polypaths/polyapi.git
cd polyapi
npm update
npm install -g pkg
```

Create an **api.bat** file in this directory with the following code.
```
@echo off
set PP_API_HOST=cc_server
set PP_API_USER=adminuser
set PP_API_PASSWORD=adminpass

rem === following two lines toggle between launching a built exe versus the script  
rem polyapi.exe %*
node index.js %*

echo (ERRORLEVEL=%ERRORLEVEL%)
```

Run the following command. If you see the following message that echos back from the server, you are in business! If not, modify the three PP_ environment variables, and/or check your firewall setting based on the error message you get.

```
C:\polyapi>api.bat echo hello world
hello world
(ERRORLEVEL=0)
```

## Build .exe

We use [PKG](https://github.com/zeit/pkg) to build the executable. the target could be: freebsd, linux, alpine, macos or win.

Run the following command to build a polyapi.exe that runs on Windows

    npm run build
    or
    pkg package.json --target node10-win-x64


## Usage

Before you can call polyapi.exe, there are three environment variables you need to set:

    set PP_API_HOST=cc_server
    set PP_API_USER=adminuser
    set PP_API_PASSWORD=adminpass

You can set them in your script before your calls, you can use certutil or base64 to encrypt your clear text password. You can also provide them when you provision your host, so no password will be shown in any clear text. 

Once set, you can issue the following command to test your setup.

    node index.js echo hello world
    or
    polyapi.exe echo hello world


## Syntax

### polyapi.exe <commands>

This syntax allows you to perform various tasks (such as run jobs, cancel jobs and check the status of jobs, Calc Central status, etc…) in Enterprise. For all the commands you can run, please refer to "EntDoc 8. APIs.pdf".

Samples:

- polyapi.exe **run** MR Upload // to run a job named "MR Upload"
- polyapi.exe **execute** OAS calc **on** MBS Rollup **asof** 20180601 // to run the OAS calc job on account "MBS Rollup" as of 2018-06-01
- polyapi.exe **status CC**

### polyapi.exe <report_file> report <report options>

the following command will generate a csv report called "report_out.csv"

- polyapi.exe report_out.csv **report** pt Hist Price **on** Market Sheet **asof** 20130103 **from** 20121001 **-secid** FNCI 3 **format csv**

### polyapi.exe exportbo 

- polyapi.exe exportbo filter_file job_filter.xml > job.xml

sample job_filter.xml
```
<PolyBOFilter>
	<BOFlag><BatchJob>Y</BatchJob></BOFlag>
    <BOFilter><BatchJob>
        <BatchName>Job 1</BatchName>
        <BatchName>Job 2</BatchName>
    </BatchJob> </BOFilter>
</PolyBOFilter>

<PolyBOFilter>
	<BOFlag><Screen>Y</Screen></BOFlag>
    <BOFilter><Screen>
        <Name>Screen 1</Name>
        <Name>Screen 2</Name>
    </Screen> </BOFilter>
</PolyBOFilter>
```
### polyapi.exe importbo in_file

The **importbo** command allows you to create/update anything in Enterprise programmatically

- polyapi.exe **importbo** **in_file** job.xml

### polyapi.exe execute xxx job_file

When running a job that involves a file, job_file argument can usually be used to upload an override the default file.

- polyapi.exe **execute** MR Upload **job_file** `c:\appport\default.mr`

### polyapi.exe <batch_file>

This utility will support a "batch mode". The idea is to allow polyapi to run multiple, depending commands in a script, whose relationship/dependency is hard to implement in a script. 

As of now, other than Enterprise APIs, it also supports following commands:

**cmd** to run a Windows command
**check-on**/**check-off** to turn on/off the check (default is off), which will exit the script when any job failed. 
**comment** output comment

More (conditional) commands such as IF, ELSE, LOOP, DIR, EXIT, etc... will be added in the future release. 

Sample usage:

polyapi.exe mybatch.txt // to run all the commands in the file.

mybatch.txt:
```
cmd dir
check-on
echo hello world
comment execute MR File Wait 0 asof 20190103
execute CSV Position Upload
execute Overnight Calculation on Top Rollup
run OAS Report
run Scenario Report
```

## Return Codes

Status Codes (exit code) from this command line tool. This should be used to drive the workflow in your script.
```
-3 : System Errors, such as wrong host name, network error, etc...
-2 : (Enterprise Job) Failed, Killed, for backward compatibility
-1 : Enterprise Errors, such as Cannot find the job name
 0 : Successful or (Enterprise Job) Finished
 2 : (Enterprise Job) Running, Scheduled, Waiting, Pending
 n : For status queries that returns a number
```

Some Sample Commands
```
polyapi.exe execute quick_upload_mr job_file C:\polypaths\data2\20180802.mr
polyapi.exe execute quick_upload_mr job_file 20180802.mr
polyapi.exe status job CF_PF_Upload
polyapi.exe status job ss_pf_upload
polyapi.exe status job Dummy Wait
polyapi.exe status job rerun_pf_upload
polyapi.exe status job MRUpload22
polyapi.exe status job dw daily pf upload
polyapi.exe status num calc
```