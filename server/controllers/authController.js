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
        const newUser=new UserMOdel({...req.body,password:hashedPassword});

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