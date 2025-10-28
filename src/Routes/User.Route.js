import { Router } from "express";
import { upload } from "../Middleware/Multer.Middleware.js";
import { LogIn, LogOut, Register } from "../Controllers/user.controller.js";
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

export default router