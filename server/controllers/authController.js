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

const logout=(req,res)=>{
    res.redirect('/login')
}


module.exports={
    signUp,
    signIn,
    googleAuthSignIn,
    initiateGoogleLogin,
    handleGoogleCallback,
    logout,
}