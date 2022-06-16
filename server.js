const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { probeTSFiles } = require("./api");

const server = express();

const logfile = "logs.txt";
const filetypes = [".mp4", ".mov"];

const log = (msg) => {
    fs.appendFileSync(logfile, `${msg}\n`);
};

const logger = (req, res, next) => {
    log(`${req.method} at ${req.path}`);
    next();
};

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, "./videos"); // TODO: use path to make platform independent paths
    },
    filename : (req, file, cb) => {
        cb(null, `${path.parse(file.originalname).name}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage:storage,
    fileFilter: (req, file, cb) => {
        //console.log("filtering");
        const ext = path.extname(file.originalname);
        if (!filetypes.includes(ext)) {
            log("bad extension, file must be .mp4 or .mov");
            cb(null, false);
        } else {
            cb(null, true);
        }
    }
});

server.use(logger);
server.use(cors());

// ====== ROUTES ======

server.get("/", (req, res) => {
    res.status(200).send("video-upload-server running");
});

/*
    accepts multipart/form-data where key file is attached to video blob
*/
server.post(
    "/upload",
    upload.single("file"),
    (req,res) => {
        if (req.file === undefined) {
            log("fileFilter rejected file");
            res.status(400).send(`fileFilter rejected file, check extension types must be one of ${filetypes.join(", ")}`);
        } else {
            log(`received ${req.file.originalname}`);
            res.sendStatus(200);
        }
    }
);

/*
    returns a list of filenames under ./videos separated by newlines
*/
server.get("/listvideos", (req,res)=> {
    fs.readdir("./videos", (err, files) => { // TODO: use path to make platform independent paths
        if (err) {
            log(err);
            res.status(500).send("server error reading files");
        } else {
            var o = "";
            files.forEach(file => {
                if (filetypes.includes(path.extname(file))) {
                    o += `${file}\n`;
                }
            });
            res.status(200).type("text/plain").send(o);
        }
    });
});

/*
    returns a list of hls video ids under ./hls_videos separated by newlines
*/
server.get("/hls/list", (req, res) => {
    fs.readdir("./hls_videos", {withFileTypes:true}, (err, files) => {
        if (err) {
            log(err);
            res.status(500).send("server error reading files");
        } else {
            var o = {};
            files.forEach(file => {
                if (file.isDirectory()) {
                    const content = fs.readFileSync(`./hls_videos/${file.name}/metadata.txt`);
                    o[file.name] = content.toString();
                }
            });
            res.status(200).type("application/json").send(o);
        }
    });
});

server.get("/hls/fraglengths/:videoid", (req, res) => {
    const vid = req.params.videoid;
    probeTSFiles(path.join(__dirname, "hls_videos", vid), (err, data) => {
        if (err) {
            res.status(400).send(err);
        } else {
            try {
                var o = {};
                for (var key in data) {
                    var duration = data[key].streams[0].duration;
                    o[key] = {"duration" : duration};
                }
                res.status(200).type("application/json").send(o);
            } catch (err) {
                res.status(500).send(err);
            }
        }
    })
});

/*
    returns a specific hls video m3u8 file
*/
server.get('/hls/:videoid', (req, res) => {
    const vid = req.params.videoid;
    const fp = path.join(__dirname, `/hls_videos/${vid}/output.m3u8`);
    if (fs.existsSync(fp)) {
        res.status(200).sendFile(fp);
    } else {
        res.status(400).send("no video with this id exists");
    }
});

// returns a ts file
server.get("/hls/:videoid/:tsfile", (req, res) => {
    const vid = req.params.videoid;
    const ts = req.params.tsfile;
    const fp = path.join(__dirname, `hls_videos/${vid}/${ts}`);
    if (fs.existsSync(fp)) {
        res.status(200).sendFile(fp);
    } else {
        res.status(400).send("no ts file under this videoid with this name exists");
    }
});

// ====== SETUP ======

server.listen(2003, ()=>{
    log(`\nServer started ${new Date().toISOString()}`)
    console.log("video-upload-server by Jonathan Huo\nserver now listening on port 2003");
    console.log("logs under ./logs.txt")
});