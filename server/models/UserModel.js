const mongoose=require("mongoose")
const jwt=require("jsonwebtoken")

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:false,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
        default:"",
    },
    img:{
        type:String,
        default:"",
    },
    googleSignIn:{
        type:Boolean,
        required:false,
        default:false,
    },
    projects:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Projects",
        default:[],
    },
    teams:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Teams",
        default:[],
    },
    notifications:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"notifcations",
        default:[],
    },
    works:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Works",
        default:[],
    },
    tasks:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Tasks",
        default:[]
    },
    

},{
    timestamps:true,
})

UserSchema.method.generateVerificationToken=function(){
    const user=this;
    const verificationToken=jwt.sign({ID:user._id},process.env.JWT_SECRET,{expiresIn:"7d"});

    return verificationToken;

}

module.exports=mongoose.model('User',UserSchema);