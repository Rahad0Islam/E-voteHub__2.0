import { upload } from "../Middleware/Multer.Middleware.js";
import { NomineeReg } from "../Models/Nominee.Model.js";
import { User } from "../Models/User.Model.js";
import { VoteEvent } from "../Models/VoteEvent.Model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { AsynHandler } from "../Utils/AsyncHandler.js";
import { FileDelete, FileUpload } from "../Utils/Cloudinary.js";
import jwt from 'jsonwebtoken';

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






export{
    CreateVoteEvent,
    NomineeRegister

}