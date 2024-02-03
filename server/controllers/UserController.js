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

// func user
const findUser=async(req,res,next)=>{
    try{
        const user=await UserModel.findById(req.params.id);
        res.status(200).json(user);
    }catch(err){
        next(err)

    }
}

const getUser=async (req,res,next)=>{
    try{
        const user=await UserModel.findById(req.user.id).populate("notification").populate({
            path:"teams",
            populate:{
                path:"member.id",
                select:"_id name email",
            }
        }).populate("projects").populate("works").populate("tasks");

        // debug user
        console.log(user);
        res.status(200).json(user);

    }catch(err){
        console.log(req.user);
        next(err);

    }
}

const getNotification=async(req,res,next)=>{
    try{
        const user=await UserModel.findById(req.user.id);
        const notifications=user.notifications;
        const notificationArray=[];
        for(let i=0;i<notifications.length;i++){
            const notification=await Notification.findById(notifications[i]);
            notificationArray.push(notification);
        }
        res.status(200).json(notificationArray);
    }catch(err){
        next(err)
    }
}

// fetch all works of user
const getWorks=async (req,res,next)=>{
    try{
        const user=await UserModel.findById(req.user.id).populate({
            path:"works",
            populate:{
                path:"tasks",
                populate:{
                    path:"members",
                    select:"name img",
                }
            }
        }).populate({
            path:"works",
            populate:{
                path:"createdId",
                select:"name img"
            }
        }).sort({updatedAt:-1});
        if(!user) return next(createError(4040,"User not found"));

        const workArray=[];
        await Promise.all(user.workArray.map(async(work)=>{
            workArray.push(work);
        })).then(()=>{
            res.status(200).json(workArray)
        })


    }catch(err){
        next(err)
    }
}

module.exports={
    findUser,
    update,
    deleteUser,
    getUser,
    getNotification,
}
