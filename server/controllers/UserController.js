const UserModel=require("../models/UserModel")
const TeamsModel=require("../models/Teams")
const Projects=require("../models/project")
const {createError}=require("../error")
const Notification=require("../models/notification")

const update=async(req,res,next)=>{
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
    if(req.params.id===req.user.id){
        try{
            await UserModel.findByIdAndDelete(req.params.id);
            res.status(200).json("User has been deleted")
        }catch(err){
            next(err);

        }
    }else{
        return next(createError(403,"You can delete only your account"))
    }
    
}

// finc user
const findUser=async(req,res,next)=>{
    try{
        const user=await UserModel.findById(req.params.id);
        res.status(200).json(user);
    }catch(err){
        next(err)

    }
}

module.exports={
    findUser,
    update,
    deleteUser,
}
