// convert videos files under videos/ to hls format under hls_videos/

const {program} = require("commander");
const api = require("./api");

const defaultDest = "./hls_videos/";

program
    .name("hlsjs")
    .description("converts mp4,mov to http live streamable format")
    .version("1");

program.command("convert")
    .description("converts file to hls format")
    .argument("<file>", "mp4,mov file to convert to hls format")
    .option("--dest <string>", "destination folder", defaultDest)
    .option("-p, --prepend", "adds the video id as a url prefix to the .ts filenames in the .m3u8 playlist")
    .action((file, opts) => {
        api.makeHLS(file, opts.dest, opts.prepend);
    });

program.command("probe_durations")
    .description("gets durations of all .ts files under a folder as json")
    .argument("<folder>", "folder path containing all .ts files")
    .action((folder, opts) => {
        api.probeTSFiles(folder, (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(data);
        });
    });

program.command("test")
    .description("prints 'testing...' to console")
    .action(()=>{
        console.log('testing...');
    });

program.parse();