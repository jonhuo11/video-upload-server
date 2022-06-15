# server.js

Run the server on port 2003 using `npm start`

Send a POST request with multipart/form-data with key "file" mapped to video blob to serverurl:2003/upload to upload a video

Supports http live streaming videos under ./hls_videos, try using https://hls-js.netlify.app/demo/ to test it.

Currently only works on mac darwin (`ffprobe` binary and also file paths are hardcoded to be unix format)

# cli.js

Command line tool for converting files to http live streaming format and some other tools.

Use `node cli.js` to run. Use flag -p to set up the urls for HLS.
