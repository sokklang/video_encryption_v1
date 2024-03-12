@echo off

set "input_file=%~1"
for %%I in ("%input_file%") do set "dirname=%%~nI"

mkdir "%dirname%"

ffmpeg -hwaccel cuda -i "%input_file%" ^
       -vf scale=1920:1080 -c:v h264_nvenc -b:v 4000k -maxrate 5000k -bufsize 8M -c:a aac -b:a 192k ^
       -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "%dirname%/1080p_%%03d.ts" "%dirname%/1080p.m3u8" ^
       -vf scale=1280:720 -c:v h264_nvenc -b:v 2500k -maxrate 3000k -bufsize 5M -c:a aac -b:a 128k ^
       -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "%dirname%/720p_%%03d.ts" "%dirname%/720p.m3u8" ^
       -vf scale=854:480 -c:v h264_nvenc -b:v 1000k -maxrate 1500k -bufsize 3M -c:a aac -b:a 96k ^
       -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "%dirname%/480p_%%03d.ts" "%dirname%/480p.m3u8"

echo #EXTM3U > "%dirname%/master.m3u8"
echo #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080 >> "%dirname%/master.m3u8"
echo 1080p.m3u8 >> "%dirname%/master.m3u8"
echo #EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720 >> "%dirname%/master.m3u8"
echo 720p.m3u8 >> "%dirname%/master.m3u8"
echo #EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480 >> "%dirname%/master.m3u8"
echo 480p.m3u8 >> "%dirname%/master.m3u8"
