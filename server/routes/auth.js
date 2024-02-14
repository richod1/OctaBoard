const express=require("express")
const router=express.Router();
const {verifyToken}=require("../middleware/verifyToken")
const {localVariables}=require("../middleware/auth")


// auth routes
const {signUp,
    signIn,
    logout,
    googleAuthSignIn,
    initiateGoogleLogin,
    handleGoogleCallback,
    Googlelogout,
    generateOTP,
    createResetSession,
    findUserByEmail,
    verifyOTP,
    resetPassword} =require("../controllers/authController")


// route endpoint
router.post("/signup",signUp);

router.post("/signin",signIn);

router.post("/logout",logout);

router.post("/googleAuthSignIn",googleAuthSignIn);

router.get("/findbyemail",findUserByEmail);

router.get("/generateotp",localVariables,generateOTP);

router.get("/verifyotp",verifyOTP)

router.put("/forgotpassword",resetPassword)

router.put("/createResetSession",createResetSession)


router.get('/auth/google/callback',handleGoogleCallback)

router.get('/auth/google',initiateGoogleLogin);

router.get("/google-logout",Googlelogout)


module.exports=router;


