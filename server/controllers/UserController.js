const UserModel=require("../models/UserModel")
const TeamsModel=require("../models/Teams")
const Projects=require("../models/project")
const {createError}=require("../error")
const Notification=require("../models/notification")

const updateUser=async(req,res,next)=>{
    if(req.params.id===req.user.id){
        try{
            const updateUser=await UserModel.findByIdAndUpdate(
                req.params.id,{$set:req.body},{new:true}
            )
            res.status(200).json(updateUser)
        }catch(err){
            next(err)   
        }
    }else{
        return next(createError(403,"You can only update your account"))
    }
}


// delete User
const deleteUser=async (req,res,next)=>{
    
}
