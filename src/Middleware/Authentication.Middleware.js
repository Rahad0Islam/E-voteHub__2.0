import { User } from "../Models/User.Model.js";
import { ApiError } from "../Utils/ApiError.js";
import { AsynHandler } from "../Utils/AsyncHandler.js";
import jwt from 'jsonwebtoken'

const jwtVerification=AsynHandler(async(req,res,next)=>{
   try {
     const Token=req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer","")
 
     if(!Token)throw new ApiError(401,"Authentication error! ");
     
     const DecodeToken=jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET);
     const user=await User.findById(DecodeToken?._id).select("-Password -RefreshToken")
 
 
     if(!user)throw new ApiError(401,"Invalid access token !")
     req.user=user;
      next()
   } catch (error) {
     throw new ApiError(401,"Invalid access token !")
   }

})


export{jwtVerification}