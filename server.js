const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cors = require("cors");

const server = express();

const filetypes = [".mp4", ".mov"];

const logger = (req, res, next) => {
    console.log(`${req.method} at ${req.path}`);
    next();
};

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, "./videos");
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
            console.log("bad extension, file must be .mp4 or .mov");
            cb(null, false);
        } else {
            cb(null, true);
        }
    }
});

server.use(logger);
server.use(cors());

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
            console.log("fileFilter rejected file");
            res.status(400).send(`fileFilter rejected file, check extension types must be one of ${filetypes.join(", ")}`);
        } else {
            console.log(`received ${req.file.originalname}`);
            res.sendStatus(200);
        }
    }
);

/*
    returns a list of filenames under ./videos separated by newlines
*/
server.get("/listvideos", (req,res)=> {
    fs.readdir("./videos", (err, files) => {
        if (err) {
            next(err);
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

server.listen(2003, ()=>{
    console.log("video-upload-server by Jonathan Huo\nserver now listening on port 2003");
});