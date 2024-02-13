const UserModel=require("../models/UserModel")
const nodemailer=require("nodemailer")
const jwt=require("jsonwebtoken")
const {createError}=require("../error")
const bcrypt=require("bcrypt")
const otpGenerator=require("otp-generator")


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
        }else if(user.gogleSignIn==false){
            return next(createError(201,"User already exist with this email"))
        }
    }catch(err){
        next(err)
    }
}


module.exports={
    signUp,
    signIn,
    googleAuthSignIn,
}