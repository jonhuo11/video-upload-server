// convert videos files under videos/ to hls format under hls_videos/

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const {program} = require("commander");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const defaultDest = "./hls_videos/";

program
    .name("hlsjs")
    .description("converts mp4,mov to http live streamable format")
    .version("1");

program.command("convert")
    .description("converts file to hls format")
    .argument("<file>", "mp4,mov file to convert to hls format")
    .option("--dest <string>", "destination folder", defaultDest)
    .action((file, opts) => {
        
        var dest = opts.dest; // destination folder

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

        ffmpeg(file, {timeout: 432000})
            .addOptions([
                "-profile:v baseline",
                "-level 3.0",
                "-start_number 0",
                "-hls_time 15",
                "-hls_list_size 0",
                "-f hls"
            ])
            .output(path.join(folder, "output.m3u8"))
            .on("start", () => {
                console.log(`processing ${file}...`);
            })
            .on("end", () => {
                console.log(`converted ${file} successfully to hls`);

                fs.writeFileSync(path.join(folder, "metadata.txt"), path.parse(file).name);

                process.exit(1);
            })
            .on("error", (err, stdout, stderr) => {
                console.log(`${err.message}`);
                process.exit(1);
            })
            .run();
    });

program.parse();