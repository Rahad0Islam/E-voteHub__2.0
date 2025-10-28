import { User } from "../Models/User.Model.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { AsynHandler } from "../Utils/AsyncHandler.js";
import { FileUpload } from "../Utils/Cloudinary.js";

const Option={
    httpOnly:true,
    secure:true
}
const GenerateAccessAndRefreshToken=async function (UserID) {

  try {
      const user=await User.findById(UserID);
      if(!user)throw new ApiError(501,"user not found ! ")

      const AccessToken=  user.GenerateAccessToken();
      const RefreshToken=user.GenerateRefreshToken();
  
      user.RefreshToken=RefreshToken;
      await user.save({validateBeforeSave:false})
      return {AccessToken,RefreshToken}
  } catch (error) {
      throw new ApiError(501,"cannot generate access and refresstoken ")
  }
}


const Register=AsynHandler(async(req,res)=>{
  console.log("hhelo");

    const {FullName="",UserName="",Email="",DateOfBirth="",Gender="",Password="",NID="",PhoneNumber=""}=req.body;
    console.log(UserName,"   dff");
    if(FullName==="" || UserName==="" || 
        Email==="" || DateOfBirth===""||
         Gender==="" || Password==="" || NID===""){
            throw new ApiError(401,"All feilds are required")
         }

    const AlreadyExistEmailUsername= await User.findOne({
        $or:[{Email},{UserName}]
    })

    if(AlreadyExistEmailUsername)throw new ApiError(401,"Username or Email already Exist");

    let ProfileImageLocalPath="";
    let CoverImageLocalPath="";

    if (
            Array.isArray(req.files?.ProfileImage) &&
            req.files?.ProfileImage.length > 0 &&
            Array.isArray(req.files?.CoverImage) &&
            req.files?.CoverImage.length > 0)
       {
      ProfileImageLocalPath=req.files?.ProfileImage[0]?.path;
      CoverImageLocalPath= req.files?.CoverImage[0]?.path;
    }



    if(!ProfileImageLocalPath){
        throw new ApiError(401,"profile picture is required");
    }
    if(!CoverImageLocalPath){
        throw new ApiError(401,"Cover image is required");
    }
    
    console.log(ProfileImageLocalPath);
    console.log(CoverImageLocalPath);

    const ProfileImage=await FileUpload(ProfileImageLocalPath);
    const CoverImage=await FileUpload(CoverImageLocalPath);

    if(!ProfileImage || !CoverImage)throw new ApiError(501,"Cloudinary problem")
    
    
   const user=await User.create({
      FullName,
      UserName,
      Email,
      DateOfBirth,
      Gender,
      Password,
      NID,
      PhoneNumber,
      ProfileImage:ProfileImage?.url,
      CoverImage:CoverImage?.url,
      ProfilePublicId:ProfileImage?.public_id,
      CoverPublicId:CoverImage?.public_id
   })

   const CreateUser=await User.findById(user._id).select("-Password -RefreshToken");
   if(!CreateUser)throw new ApiError(501,"Something Went Wrong while regestering! ")

    return res.status(201).json(new ApiResponse(201,CreateUser,"Registered succesfully! "))
})


const LogIn=AsynHandler(async(req,res)=>{
    const {UserName,Email,Password}=req.body;

    if ((!UserName?.trim() && !Email?.trim()) || !Password?.trim()) {
    throw new ApiError(401, "Username or Email and Password are required!");
    }

    const user=await User.findOne({
        $or:[{Email},{UserName}]
    })

    if(!user)throw new ApiError(401,"user not found!");

    const IsPassCorr=await user.IsPasswordCorrect(Password)
    if(!IsPassCorr)throw new ApiError(401,"Password is not correct ");

    const {AccessToken,RefreshToken}=await GenerateAccessAndRefreshToken(user._id)
    console.log("AccessToken : ",AccessToken);
    
    const LogInUser=await User.findById(user._id).select("-Password -RefreshToken")
    if(!LogInUser)throw new ApiError(501,"User not found")

    console.log("Log in succesfully! ");
    return res
    .status(201)
    .cookie("AccessToken",AccessToken,Option)
    .cookie("RefreshToken",RefreshToken,Option)
    .json(
        new ApiResponse(201,{AccessToken,RefreshToken,LogInUser},"log in successfully ")
    )

})

const LogOut=AsynHandler(async(req,res)=>{
    console.log("Log out SuccesFully!");
    return res
    .status(201)
    .clearCookie('AccessToken',Option)
    .clearCookie('RefreshToken',Option)
    .json(
        new ApiResponse(201,"Logout Succesfully!")
    )
})

export {
    Register,
    LogIn,
    LogOut
}