import express from 'express'
import dotenv from 'dotenv'
import MongoDbConnect from './DB/MongoDbConnect.js';
import { app } from './app.js';
dotenv.config();
const Port=process.env.PORT || 8002;

MongoDbConnect()
.then(()=>{
    app.get("/",(req,res)=>{
        res.send("back-end  ready ")
    })
    
    app.listen(Port,()=>{
        console.log("server is listening on Port: ",Port);
    })


})
.catch(()=>{
     console.log("Mongodb connection failed from index");
})
