import { Router } from "express";
import { upload } from "../Middleware/Multer.Middleware.js";
import { ChangePassword, LogIn, LogOut, Register, RenewAccesToken, UpdateCoverPic, UpdateProfilePic } from "../Controllers/user.controller.js";
import { jwtVerification } from "../Middleware/Authentication.Middleware.js";
const router=Router();

router.route('/register').post(
    upload.fields([
        {
           name:"ProfileImage",
           maxCount:1
        },
        {
           name:"CoverImage",
           maxCount:1
        }
    ]),Register
)
router.route("/login").post(upload.none(),LogIn);
router.route("/logout").post(jwtVerification,LogOut);
router.route("/renewaccestoken").post(RenewAccesToken)

router.route("/changepassword").post(upload.none(),jwtVerification,ChangePassword)
router.route("/UpdateProfilePicture").patch(
    upload.single("ProfileImage"),
    jwtVerification,UpdateProfilePic)


router.route("/UpdateCoverPicture").patch(
    upload.single("CoverImage"),
    jwtVerification,UpdateCoverPic)

export default router