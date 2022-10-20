@echo off
set PP_API_HOST=localhost
set PP_API_USER=admin
set PP_API_PASSWORD=admin

rem ===== full export/import
rem polyapi.exe exportbo filter_file export_all_filter.xml > exported_all_bos.xml
rem polyapi.exe importbo in_file exported_all_bos.xml > import_status.txt

rem ===== selected export/import 
rem polyapi.exe exportbo filter_file export_filters.xml > exported_some_bos.xml
polyapi.exe importbo in_file exported_some_bos.xml > import_status.txt
