import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import multer from "multer";
import path from "path";
import { exec } from "child_process";
import { stderr, stdout } from "process";

const app = express()
app.use(express.json({limit: "100mb"}))
const port = 8000;
app.use(cors({
    origin : ["http://localhost:3000", "http://localhost:5173"],
    credentials : true
}))

const storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, "./uploads")
    },
    filename : function(req, file, cb){
        cb( null, file.fieldname+"-"+uuidv4()+ path.extname(file.originalname))
    }
})

const upload = multer({storage})

app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*"),
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
})

app.use(express.urlencoded({extended: true, limit: "100mb"}))
app.use('/uploads', express.static("uploads"))

app.get("/", function(req,res){
    res.json({message : "hiii there"})
})
//@ts-ignore
app.post('/uploads', upload.single("file"), function(req, res ){
    if(!req.file){
        return res.status(500).json({error : "file does not found on uploads"})
    }
    const videoId = uuidv4()
    const videoPath = req.file?.path
    const outPath = `uploads/videos/${videoId}`
    const hlsPath = `${outPath}/index.m3u8`
    console.log(`hlspath is ${hlsPath}`);

    if(!fs.existsSync(outPath)){
        fs.mkdirSync(outPath, {recursive : true})
    }

    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;

    exec( ffmpegCommand, (error, stdout, stderr)=>{
        if(error){
            console.log(`error is ${error}`); 
            return res.status(500).send({message : "ffmpeg fails to generate"})           
        }
        console.log(`stdoutput is ${stdout}`);
        console.log(`stderror is ${stderr}`);
        const videoUrl = `http://localhost:8000/uploads/videos/${videoId}/index.m3u8`;

        res.json({
            videoId: videoId,
            videoUrl : videoUrl,
            message : "video converted successfully in hls"
        })
    })

})


app.listen(port,()=>{
    console.log(`listening on port : ${port} `);
    
})