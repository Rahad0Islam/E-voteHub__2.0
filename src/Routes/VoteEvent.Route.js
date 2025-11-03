import { Router } from "express";
import { upload } from "../Middleware/Multer.Middleware.js";
import { jwtVerification } from "../Middleware/Authentication.Middleware.js";
import { CreateVoteEvent } from "../Controllers/VoteEvent.controller.js";
const router=Router();

router.route("/VoteEvent").post(jwtVerification,
     
    upload.fields([
       {
           name:"BallotImage",
           maxCount:10
       }
    ]),
    
    CreateVoteEvent)


export default router;