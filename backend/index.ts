import express from "express";
 
const app = express()
app.use(express.json())
const port = 8000;

app.get("/", function(req,res){
    res.json({message : "hiii there"})
})

app.listen(port,()=>{
    console.log("listening on port 8000");
    
})