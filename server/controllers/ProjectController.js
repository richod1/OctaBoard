const UserModel=require("../models/project")
const jwt=require("jsonwebtoken")
const TaskModel=require("../models/Task")
const WorkModel=require("../models/Works")
const TeamModel=require("../models/Teams")
const Notification=require("../models/notification")
const ProjectModel=require("../models/project")
const optgenerator=require("otp-generator")
const {createError}=require("../error.js")
const nodemailer=require("nodemailer")
const bcrypt=require("bcrypt")

const addProject=async(req,res,next)=>{
    const user=await UserModel.findById(req.user.id);
    if(!user){
        return next(createError(404,"User not found"))
    }
    const newProject=new ProjectModel({members:[{id:user.id,img:user.img,email:user.email,name:user.name,role:"d",access:"Owner"}],...req.body});
    try{
        const saveProject=await(await newProject.save());
        UserModel.findByIdAndUpdate(user.id,{
            $push:{projects:saveProject._id}
        },{new:true},(err,doc)=>{
            if(err){
                next(err)
            }
        });
        res.status(200).json(saveProject)

    }catch(err){
        next(err)
    }
}


const deleteProject=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"Project not found"));
        for(let i=0;i<project.members.length;i++){
            if(project.members[i].id.toString()===req.user.id){
            if(project.members[i].id.toString()===req.user.id){
                if(project.members[i].access==="Owner"){
                    await project.delete();

                    UserModel.findByIdAndDelete(req.user.id,{
                        $pull:{projects:req.param.id}
                    },{new:true}).exec();
                    for(let j=0;j<project.members.length;j++){
                        UserModel.findByIdAndUpdate(project.members[j].id,{
                            $pull:{projects:req.params.id}
                        },{new:true}).exec()
                    }
                    res.status(200).json("Project has been deleted")
                }
            }else{
                return next(createError(403,"You are not allowed to delete this project"))
            }
            
            }
        }

    }catch(err){
        next(err)

    }
}

const getProject=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id).populate("members.id","_id name email img");

        var verified=false;
        await Promise.all(
            project.members.map(async (Member)=>{
                if(Member.id.id===req.user.id){
                    verified=true
                }
            })
        ).then(()=>{
            if(verified){
                return res.status(200).json(project)
            }else{
                return next(createError(403,"Ypu are not allowed to view this project"))
            }
        })

    }catch(err){
        next(err)
    }
}

const updateProject=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"project not found!"))
        for(let i=0;i<project.members.length;i++){
    if(project.members[i].id.toString()===req.user.id.toString()){
        if(project.members[i].access==="Owner"|| project.members[i].access==="Admin" || project.members[i].access==="Editor"){
            const updateproject=await PtojectModel.findByIdAndUpdate(
                req.params.id,
                {
                    $set:req.body,
                },
                {new:true}
            );
            res.status(200).json({message:"Project has been updated..."})
        }else{
            return next(createError(403,"You are not allowed to update this project"))
        }
    }
    }
    return next(createError(403,"You can update only if you are member of this project"))

    }catch(err){
        next(err)
    }
}

module.exports={
    addProject,
    deleteProject,
    getProject,
    updateProject,
}