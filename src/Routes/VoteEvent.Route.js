import { Router } from "express";
import { upload } from "../Middleware/Multer.Middleware.js";
import { jwtVerification } from "../Middleware/Authentication.Middleware.js";
import { CountingVote, CreateVoteEvent, GetAllBallotImage, GetAvailableBallotImage, GetUsedBallotImage, GivenVote, NomineeApproved, NomineeRegister, VoterRegister } from "../Controllers/VoteEvent.controller.js";
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
router.route("/countvote").get(jwtVerification,CountingVote);
router.route("/nomineeApproval").post(jwtVerification,NomineeApproved)

router.route("/getallballot").get(jwtVerification,GetAllBallotImage)
router.route("/getAvailableBallot").get(jwtVerification,GetAvailableBallotImage);
router.route("/getUsedBallot").get(jwtVerification,GetUsedBallotImage);

export default router;