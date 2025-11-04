import { Router } from "express";
import { upload } from "../Middleware/Multer.Middleware.js";
import { jwtVerification } from "../Middleware/Authentication.Middleware.js";
import { CreateVoteEvent, GivenVote, NomineeRegister, VoterRegister } from "../Controllers/VoteEvent.controller.js";
const router=Router();

router.route("/VoteEvent").post(jwtVerification,
     
    upload.fields([
       {
           name:"BallotImage",
           maxCount:10
       }
    ]),
    
    CreateVoteEvent)

router.route("/nomineReg").post(jwtVerification,NomineeRegister)
router.route("/voterReg").post(jwtVerification,VoterRegister)
router.route("/voting").post(jwtVerification,GivenVote)

export default router;