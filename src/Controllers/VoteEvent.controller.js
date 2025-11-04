import { upload } from "../Middleware/Multer.Middleware.js";
import { NomineeReg } from "../Models/Nominee.Model.js";
import { VoteCount } from "../Models/VoteCount.Model.js";
import { VoteEvent } from "../Models/VoteEvent.Model.js";
import { VoterReg } from "../Models/Voter.Model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { AsynHandler } from "../Utils/AsyncHandler.js";
import { FileDelete, FileUpload } from "../Utils/Cloudinary.js";
import mongoose from "mongoose";


const CreateVoteEvent = AsynHandler(async(req,res)=>{

    const CreateBy = req.user?._id; 
    if (!CreateBy || req.user.Role!=="admin") {throw new ApiError(401, "Unauthorized: Admin not found");}

    const {Title="",Description="",RegEndTime,VoteStartTime,
    VoteEndTime,ElectionType}=req.body;

   if (!Title || !RegEndTime || !VoteStartTime || !VoteEndTime || !ElectionType) {
    throw new ApiError(402, "All fields are required");
   }

    
    let BallotImagePath=[];
    let array=req.files?.BallotImage;
    if(!array)throw new ApiError(401,"BallotImages Are needed! ");


    for (let index = 0; index < array.length; index++) {
        const element = array[index]?.path;
        const LocalPath=await FileUpload(element);
        
        if(!LocalPath){throw new ApiError(401,"BallotImage required");}
          else{
           BallotImagePath.push({
            url: LocalPath?.url,
            publicId: LocalPath?.public_id
           
         });

        }
    }

    const createEvent= await VoteEvent.create({
        Title,
        Description,
        BallotImage:BallotImagePath,
        RegEndTime,
        VoteStartTime,
        VoteEndTime,
        ElectionType,
        CreateBy
    })
   
    console.log("Event Create succesfully!");
   return res
          .status(201)
          .json(
            new ApiResponse(201,createEvent,"Event create Succesfully! ")
          )

})


const NomineeRegister=AsynHandler(async(req,res)=>{
     if (!req.body) {
     throw new ApiError(400, "Request body is missing");
       }


     const {Description,SelectedBalot,EventID}=req.body;
     if(!SelectedBalot){
        throw new ApiError(401,"Ballot select are required");
     }



     if(!EventID){
        throw new ApiError(401,"Event id are required");
     }


     const UserID=req.user?._id;
     if(!UserID){
        throw new ApiError(401,"User not found");
     }



      const Event = await VoteEvent.findById(EventID);
       if (!Event) {
      throw new ApiError(401, "Vote event not found");
       }
     


     const checkReg=  await NomineeReg.findOne({EventID,UserID});
      if(checkReg){
         throw new ApiError(401,"You are already registered");
      } 

      if (new Date() > new Date(Event.RegEndTime)) {
          throw new ApiError(403, "Nominee Registration period has ended");
       }


     const NomineeID=await NomineeReg.create({
         UserID,
         EventID,
         SelectedBalot,
         Description
     })
      
     if(!NomineeID){
        throw new ApiError(401,"Nominee register not completed");
     }
     console.log("Nominee register succesfully");
     return res
     .status(201)
     .json(
        new ApiResponse(201,NomineeID,"Nominee register succesfully! awaiting admin approval")
     )

})


const VoterRegister=AsynHandler(async(req,res)=>{
     if (!req.body) {
     throw new ApiError(400, "Request body is missing");
       }


     const {EventID}=req.body;
    
     if(!EventID){
        throw new ApiError(401,"Event id are required");
     }


     const UserID=req.user?._id;
     if(!UserID){
        throw new ApiError(401,"User not found");
     }



      const Event = await VoteEvent.findById(EventID);
      if (!Event) {
           throw new ApiError(401, "Vote event not found");
       }


    const existingVoter = await VoterReg.findOne({ EventID, UserID });
        if (existingVoter) {
           throw new ApiError(409, "You are already registered to vote for this event");
        }


       if (new Date() > new Date(Event.RegEndTime)) {
       throw new ApiError(403, "Registration period has ended");
       }

      const votingReg= await VoterReg.create({
           EventID,
           UserID,
           
       })
    if(!votingReg){
        throw new ApiError(501,"failed to register for vote");
    }
    console.log("successfully register for vote!");
    return res
    .status(201)
    .json(
        new ApiResponse(201,votingReg,"successfully register for vote!")
    )
})



const GivenVote=AsynHandler(async(req,res)=>{
     
    const {EventID,ElectionType,SelectedNominee}=req.body;

    const UserID=req.user?._id;
    if(!EventID || !UserID || !ElectionType || !SelectedNominee){
        throw new ApiError(401,"EventId and user invalid! ");
    }


    const DetailsVoteReg=await VoterReg.findOne({EventID,UserID});
     

    if(!DetailsVoteReg){
        throw new ApiError(401,"You are not Registered!");
    }


    for (const nominee of SelectedNominee) {
        const exists = await NomineeReg.findOne({
        UserID: nominee.NomineeId,
        EventID
        });
        if (!exists) {
            throw new ApiError(404, `Nominee ${nominee.NomineeId} is not valid for this event`);
        }
     }


    if(DetailsVoteReg.hasVoted){
        throw new ApiError(401,"you are already given vote! ");
    }
    
     const Event = await VoteEvent.findById(EventID);
      if (!Event) {
           throw new ApiError(401, "Vote event not found");
       }
        console.log("rahad");
        const now = new Date();
        const start = new Date(Event.VoteStartTime);
        const end = new Date(Event.VoteEndTime);

        console.log("Now:", now);
        console.log("Start:", start);
        console.log("End:", end);

        if (now < start || now > end) {
        throw new ApiError(403, "Voting is not currently open");}



    const Vote= await VoteCount.create({
        EventID,
        VoterID:UserID,
        ElectionType,
        SelectedNominee,

    })
    if(!Vote){
        throw new ApiError(501,"Given Vote failed!");
    }
    console.log("You are succesfully voted");



    DetailsVoteReg.hasVoted=true;
    await DetailsVoteReg.save({validateBeforeSave:false});
    
    return res
    .status(201)
    .json(
        new ApiResponse(201,Vote,"You succesfully voted!")
    )

})


const CountingVote=AsynHandler(async(req,res)=>{
    console.log("countvote");
   

     const {EventID}=req.body;
     if(!EventID){
        throw new ApiError(401,"EventID is required! ");
     }
    
    
      const eventObjectId = new mongoose.Types.ObjectId(EventID);

     const NomineeListForSingleAndMultiVote=await  VoteCount.aggregate([
        {$match:{EventID:eventObjectId,
            ElectionType:{$in: ["Single","MultiVote"]}
        }},
        {$unwind:"$SelectedNominee"},
        {
            $group:{
                _id:"$SelectedNominee.NomineeId",
                TotalVote:{$sum:1}
            }
        },
        {
         $project: {
        _id: 0,
         NomineeID: "$_id",
         TotalVote: 1
     }
       },
     { $sort: { TotalVote: -1 } } 

     ]);
    
    const NomineeListForRank=await  VoteCount.aggregate([
        {$match:{EventID:eventObjectId,
            ElectionType:"Rank"
        }},
        {$unwind:"$SelectedNominee"},
        {
            $group:{
                _id:"$SelectedNominee.NomineeId",
                TotalRank:{$sum:"$SelectedNominee.Rank"}
            }
        },
        {
         $project: {
        _id: 0,
         NomineeID: "$_id",
         TotalRank: 1
     }
       },
     { $sort: { TotalRank: 1 } } 

     ]);
    
     
    //  console.log(NomineeList);
     return res
     .status(201)
     .json(
        new ApiResponse(201,{NomineeListForRank,NomineeListForSingleAndMultiVote},"Votecount successfully! ")
     )
})


const NomineeApproved = AsynHandler(async (req, res) => {
  const { EventID, NomineeID } = req.body;

  if (req.user?.Role !== "admin") {
    throw new ApiError(401, "You are not authorized as admin");
  }

  const Event = await VoteEvent.findById(EventID);
  if (!Event) {
    throw new ApiError(404, "Vote event not found");
  }
   


  const NomineeRegForm = await NomineeReg.findOne({ EventID, UserID: NomineeID });
  if (!NomineeRegForm) {
    throw new ApiError(404, "Nominee not found for this event");
  }
   
  if(NomineeRegForm.Approved){
    throw new ApiError(402,"Already approved ! ")
  }

  NomineeRegForm.Approved = true;
   await NomineeRegForm.save({ validateBeforeSave: false });

    const nomineeImage = {
    url: NomineeRegForm.SelectedBalot?.url,
    publicId: NomineeRegForm.SelectedBalot?.publicId
    };

        if (!nomineeImage.url || !nomineeImage.publicId) {
           throw new ApiError(400, "Nominee image data is missing");
       }

    

  Event.UsedBallotImage.push(nomineeImage);

    Event.BallotImage = Event.BallotImage.filter(
    img => img.publicId !== NomineeRegForm.SelectedBalot?.publicId
    );

  await Event.save({ validateBeforeSave: false });

  console.log("Nominee approved successfully!");
  

  return res.status(200).json(
    new ApiResponse(200, NomineeRegForm, "Nominee approved successfully!")
  );
});

const GetAllBallotImage=AsynHandler(async(req,res)=>{
     const {EventID} =req.body;

     if(!EventID){
        throw new ApiError(401,"EventID required! ")
     }

     const Event = await VoteEvent.findById(EventID);
     if (!Event) {
        throw new ApiError(404, "Vote event not found");
     }
    
      const allUrls = [
        ...Event.BallotImage.map(img => img.url),
        ...Event.UsedBallotImage.map(img => img.url)
     ];

  return res.status(200).json(
    new ApiResponse(200, allUrls, "All ballot image URLs retrieved successfully")
  );
     
})

const GetAvailableBallotImage=AsynHandler(async(req,res)=>{
      const {EventID} =req.body;

     if(!EventID){
        throw new ApiError(401,"EventID required! ")
     }

     const Event = await VoteEvent.findById(EventID);
     if (!Event) {
        throw new ApiError(404, "Vote event not found");
     }
    
      const allUrls = [
        ...Event.BallotImage.map(img => img.url),
     ];

  return res.status(200).json(
    new ApiResponse(200, allUrls, "Available ballot image URLs retrieved successfully")
  );
})

const GetUsedBallotImage=AsynHandler(async(req,res)=>{
      const {EventID} =req.body;

     if(!EventID){
        throw new ApiError(401,"EventID required! ")
     }

     const Event = await VoteEvent.findById(EventID);
     if (!Event) {
        throw new ApiError(404, "Vote event not found");
     }
    
      const allUrls = [
        ...Event.UsedBallotImage.map(img => img.url)
       ];

      return res.status(200).json(
    new ApiResponse(200, allUrls, "All Used ballot image URLs retrieved successfully")
  );
})


const GetApprovedNominee = AsynHandler(async (req, res) => {
  const { EventID } = req.body;

  if (!EventID) {
    throw new ApiError(401, "EventID is required!");
  }

  const NomineeDetails = await NomineeReg.find({ EventID, Approved: true }).select("UserID");

  if (!NomineeDetails || NomineeDetails.length === 0) {
    throw new ApiError(401, "No approved nominees found for this event");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      NomineeDetails,
      count: NomineeDetails.length
    }, "Approved nominees retrieved successfully")
  );
});


const GetPendingNominee = AsynHandler(async (req, res) => {
  const { EventID } = req.body;

  if (!EventID) {
    throw new ApiError(401, "EventID is required!");
  }

  const NomineeDetails = await NomineeReg.find({ EventID, Approved: false }).select("UserID");

  if (!NomineeDetails || NomineeDetails.length === 0) {
    throw new ApiError(401, "No pending nominees ");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      NomineeDetails,
      count: NomineeDetails.length
    }, "Pending nominees retrieved successfully")
  );
});


const GetVoter=AsynHandler(async(req,res)=>{
     const { EventID } = req.body;

  if (!EventID) {
    throw new ApiError(401, "EventID is required!");
  }

  const VoterDetails = await VoterReg.find({ EventID}).select("UserID");

  if (!VoterDetails || VoterDetails.length === 0) {
    throw new ApiError(401, "No voter found");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      VoterDetails,
      count: VoterDetails.length
    }, "Voter details retrived successfully")
  );

})

const getVoterPerticipate=AsynHandler(async(req,res)=>{
       const { EventID } = req.body;

  if (!EventID) {
    throw new ApiError(401, "EventID is required!");
  }

  const GivenVoter = await VoterReg.find({ EventID,hasVoted:true}).select("UserID");

  if (!GivenVoter || GivenVoter.length === 0) {
    throw new ApiError(401, "voter found");
  }

  const nonVoter=await VoterReg.find({ EventID,hasVoted:false}).select("UserID");
  
   return res.status(200).json(
    new ApiResponse(200, {
      GivenVoter,
      givenCount: GivenVoter.length,
      nonVoter,
      nonCount: nonVoter.length,
      VoterPerticapteRate:GivenVoter.length/(GivenVoter.length+nonVoter.length)*100
    }, "Successfully fetched all voter data!")
  );
})


export{
    CreateVoteEvent,
    NomineeRegister,
    VoterRegister,
    GivenVote,
    CountingVote,
    NomineeApproved,
    GetAllBallotImage,
    GetAvailableBallotImage,
    GetUsedBallotImage,
    GetApprovedNominee,
    GetPendingNominee,
    GetVoter,
    getVoterPerticipate

}