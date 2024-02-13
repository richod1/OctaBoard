const UserModel=require("../models/UserModel")
const nodemailer=require("nodemailer")
const jwt=require("jsonwebtoken")
const {createError}=require("../error")
const bcrypt=require("bcrypt")
const otpGenerator=require("otp-generator")
const axios=require("axios")


const CLIENT_ID=process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI=process.env.GOOGLE_CALLBACK;
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USERNAME,
        pass:process.env.EMAIL_PASS
    },
    port:465,
    host:'smtp.gmail.com'
})

const signUp=async(req,res,next)=>{
    const {email}=req.body;
    if(!email){
        return res.status(422).json({message:"Email ir required"})
    }
    try{
        const existingUser=await UserModel.find({email}).exec();
        if(existingUser){
            return res.status(400).send({message:"Email already exist"})
        }
        const salt=bcrypt.genSaltSync(10);
        const hashedPassword=bcrypt.hashSync(req.bocy.password,salt);
        const newUser=new UserModel({...req.body,password:hashedPassword});

        newUser.save().then((user)=>{
            const token=jwt.sign({id:user._id},process.env.SECRET_KEY,{expiresIn:"10d"})
            res.status(200).json({token,user})
        }).catch((err)=>{
            next(err);
        })

    }catch(err){
        next(err)
    }
}

const signIn=async(req,res,next)=>{
    const {email}=req.body.email;
    try{
        const user=await UserModel.findOne({email});
        if(!user){
            return next(createError(404,"User not found!"))
        }
        if(user.googleSignIn){
            return next(createError(201,"Entered Email is singned upn with google account.Please sign in with google"))
        }
        const validPassword=await bcrypt.compareSync(req.body.password,user.password);
        if(!validPassword){
            return next(createError(201,"Wrong password"));
        }

// create token for user
const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"10d"});
res.status(200).json({token,user})

    }catch(err){
    next(err);

    }

}


// google signIn
const googleAuthSignIn=async(req,res,next)=>{
    const {email}=req.body.email;
    try{
        const user=await UserModel.findOne({email})
        if(!user){
            try{
                const user=new UserModel({...req.body,googleSignIn:true});
                await user.save();
                const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"10d"});
                res.status(200).json({token,user:user});
            }catch(err){
                next(err)
            }
        }else if(user.googleSignIn){
            const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"10d"})
            res.status(200).json({token,user});
        }else if(user.googleSignIn==false){
            return next(createError(201,"User already exist with this email"))
        }
    }catch(err){
        next(err)
    }
}

const logout=(req,res)=>{
    res.clearCookie("access_token").json({message:"Logged Out!"})
}

// firebase google
const initiateGoogleLogin=(req,res)=>{
    const url=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
    res.redirect(url);
}

const handleGoogleCallback=async(req,res)=>{
    const {code}=req.query;
    try{
         // Exchange authorization code for access token
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const {access_token,id_token}=data;
     // Use access_token or id_token to fetch user profile
        const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    res.redirect('/')

    }catch(err){
        console.error('Error',err.response.data.error);
        res.redirect('/login')

    }

}

const Googlelogout=(req,res)=>{
    res.redirect('/login')
}

const generateOTP=async(req,res)=>{
    re.app.locals.OTP=await otpGenerator(6,{upperCaseAlphabets:false,specialChars:false,lowerCaseAlphabets:false,digits:true});
    const {email}=req.query;
    const {name}=req.query;
    const {reason}=req.query;
    const verifyOtp={
        to:email,
        subject:"OctaBoard Account Verification OTP",
        html:`
        <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHQMmI5x5qWbOrEuJuFWkSIBQoT_fFyoKOKYqOSoIvQ&s" alt="OctaBoard Logo" style="display: block; margin: 0 auto; max-width: 200px; margin-bottom: 20px;">
        <h1 style="font-size: 22px; font-weight: 500; color: #854CE6; text-align: center; margin-bottom: 30px;">Verify Your OctaBoard Account</h1>
        <div style="background-color: #FFF; border: 1px solid #e5e5e5; border-radius: 5px; box-shadow: 0px 3px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #854CE6; border-top-left-radius: 5px; border-top-right-radius: 5px; padding: 20px 0;">
                <h2 style="font-size: 28px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 10px;">Verification Code</h2>
                <h1 style="font-size: 32px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 20px;">${req.app.locals.OTP}</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Dear ${name},</p>
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Thank you for creating a OctaBoard account. To activate your account, please enter the following verification code:</p>
                <p style="font-size: 20px; font-weight: 500; color: #666; text-align: center; margin-bottom: 30px; color: #854CE6;">${req.app.locals.OTP}</p>
                <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Please enter this code in the OctaBoard app to activate your account.</p>
                <p style="font-size: 12px; color: #666; margin-bottom: 20px;">If you did not create a OctaBoard account, please disregard this email.</p>
            </div>
        </div>
        <br>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px; text-align: center;">Best regards from,<br>The OctaBoard Developer</p>
    </div>
        `
    };

    const resetPassword={
        to:email,
        subject:"OctaBoard Rest Password Verificarion",
        html:`
        <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHQMmI5x5qWbOrEuJuFWkSIBQoT_fFyoKOKYqOSoIvQ&s" alt="OctaBoard Logo" style="display: block; margin: 0 auto; max-width: 200px; margin-bottom: 20px;">
        <h1 style="font-size: 22px; font-weight: 500; color: #854CE6; text-align: center; margin-bottom: 30px;">Reset Your OctaBoard Account Password</h1>
        <div style="background-color: #FFF; border: 1px solid #e5e5e5; border-radius: 5px; box-shadow: 0px 3px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #854CE6; border-top-left-radius: 5px; border-top-right-radius: 5px; padding: 20px 0;">
                <h2 style="font-size: 28px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 10px;">Verification Code</h2>
                <h1 style="font-size: 32px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 20px;">${req.app.locals.OTP}</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Dear ${name},</p>
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">To reset your OctaBoard account password, please enter the following verification code:</p>
                <p style="font-size: 20px; font-weight: 500; color: #666; text-align: center; margin-bottom: 30px; color: #854CE6;">${req.app.locals.OTP}</p>
                <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Please enter this code in the OctaBoard app to reset your password.</p>
                <p style="font-size: 12px; color: #666; margin-bottom: 20px;">If you did not request a password reset, please disregard this email.</p>
            </div>
        </div>
        <br>
        <p style="font-size: 16px; color: #666; margin-bottom: 20px; text-align: center;">Best regards from,<br>The OctaBoard Developer</p>
    </div>
        `
    };

    if(reason==="FORGETPASSWORD"){
        transporter.sendMail(resetPassword,(err)=>{
            if(err){
                next(err)
            }else{
                return res.status(200).send({message:"OTP sent"})
            }
        })
    }
}


module.exports={
    signUp,
    signIn,
    googleAuthSignIn,
    initiateGoogleLogin,
    handleGoogleCallback,
    Googlelogout,
    generateOTP,
}