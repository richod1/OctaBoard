const UserModel=require("../models/UserModel")
const jwt=require("jsonwebtoken")
const {createError}=require("../error.js")
const workModel=require("../models/Works")
const mongoose=require("mongoose")


const addWork=async(req,res,next)=>{
    const user=await UserModel.findById(req.user.id);

    if(!user){
        return next(createError(404,"User not found!"));
    }

    const newWork=new  Projects({members:[{id:user.id,role:"d",access:"Owner"}],...req.body});

    try{
        const saveProject=await(await newWork.save());
        UserModel.findByIdAndUpdate(user.id,{$push:{projects:saveProject._id}},{new:true},(err,doc)=>{
            if(err){
                next(err)
            }
        })

        res.status(200).json(saveProject);

    }catch(err){
        next(err)
    }
}

module.exports={
    addWork,
}