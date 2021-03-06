
// ffmpeg stuff
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const ffprobe = require("ffprobe");

const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
//const os = require("os");

const makeHLS = (file, dest, prependVideoID=false) => {

    // confirm file and destination folder exist
    try {
        if (!fs.existsSync(file)) {
            console.log("file must exist");
            return;
        }
        if (!fs.existsSync(dest)) {
            console.log("dest folder must exist");
            return;
        }
        if (!fs.lstatSync(dest).isDirectory()) {
            console.log("dest is not a folder");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }

    // convert to hls format
    var id = uuidv4().replace(/-/g, "");
    const folder = path.join(dest, id);

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    var cmd = ffmpeg(file)
        .addOptions([
            "-profile:v baseline",
            "-level 3.0",
            "-start_number 0",
            "-hls_time 15",
            "-hls_list_size 0",
            "-f hls"
        ])
        .on("start", () => {
            console.log(`processing ${file}...`);
        })
        .on("end", () => {
            console.log(`converted ${file} successfully to hls`);

            try {
                fs.writeFileSync(path.join(folder, "metadata.txt"), path.parse(file).name);
            } catch (err) {
                console.log(err);
                return;
            }

            if (prependVideoID) {
                var fn = path.join(folder, "output.m3u8");
                fs.readFile(fn, "utf-8", (err, data) => {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var result = data.replace(/\noutput/g, `\n${id}/output`);

                    fs.writeFile(fn, result, "utf-8", (err) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                    });
                });
            }
        })
        .on("error", (err, stdout, stderr) => {
            console.log(`${err.message}`);
        })
        .output(path.join(folder, "output.m3u8"));
    cmd.run();
}

// You can change the ffprobe binary by placing it in ./bin/
const probeTSFiles = (folder, cb) => {
    try {
        if (!fs.existsSync(path.join(__dirname, "bin", "ffprobe"))) {
            return cb("no ffprobe binary found", {});
        }
    } catch (err) {
        return cb(err, {});
    }

    fs.readdir(folder, {withFileTypes:true}, (err, files) => {
        if (err) {
            return cb(err, {});
        }

        var data = {};
        var flag = false;
        var total = 0;
        files.forEach((file) => {
            if (file.name.endsWith(".ts")) { // for all ts files...
                total++;
            }
        });
        files.forEach((file) => {
            if (file.name.endsWith(".ts")) {
                var fp = path.join(folder, file.name);
                ffprobe(fp, {path:path.join(__dirname, "bin", "ffprobe")}, (err, info) => {
                    if (err) {
                        if (!flag) {
                            flag = true;
                            return cb(err, {});
                        }
                        return;
                    }
                    data[file.name] = info;
                    total--;

                    if (total <= 0) { // all data callbacks are complete
                        if (!flag) {
                            flag = true;
                            return cb(null, data);
                        }
                        return;
                    }
                });
            }
        });
    })
};

module.exports = {makeHLS, probeTSFiles};