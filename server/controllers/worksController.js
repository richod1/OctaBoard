const UserModel=require("../models/UserModel")
const jwt=require("jsonwebtoken")
const {createError}=require("../error.js")
const workModel=require("../models/Works")
const mongoose=require("mongoose")
const ProjectModel=require("../models/project")
const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")


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

const deleteProject=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);

        if(!project) return next(createError(404,"Project not found!"));
        for(let i=0;i<project.members.length;i++){
            if(project.members[i]===req.user.id){
                if(project.members[i].access==="Owner"){
                    await project.delete();

                    UserModel.findByIdAndUpdate(req.user.id,{$pull:{projects:req.params.id}},{new:true},(err,doc)=>{
                        if(err){
                            next(err)
                        }
                    });
                    res.status(200).json("Project has been deleted...");
                }else{
                    return next(createError(404,"You are not allowed to delete this project!"))
                }
            }
        }

    }catch(err){
        next(err)
    }
}

const getProject=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);
        const members=[];
        var verified=false
        await Promise.all(project.members.map(async(Member)=>{
            console.log(Member.id)
            if(Member.id===req.user.id){
                verified=true
            }

            await UserModel.findById(Member.id).then((member)=>{
                console.log(member)
                members.push({id:member.id,role:Member.role,access:Member.access,name:member.name,img:member.img,email:member.email})
            })
        })).then(()=>{
            if(verified){
                return res.status(200).json({project,members})
            }else{
                return next(createError(403,"You are not allowed to view this project"))
            }
        })

    }catch(err){
        next(err);
    }
}

const updateProject=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"project not found"));
        for(let i=0;i<project.members.length;i++){
            if(project.members[i].id===req.user.id){
                if(project.members[i].access==="Owner"||project.members[i].access==="Admin"||project.members[i].access==="Editor"){
                    const updatedProject=await ProjectModel.findByIdAndUpdate(req.params.id,{
                        $set:req.body,
                    },{
                        new:true
                    });
                    res.status(200).json(updatedProject)
                }else{
                    return next(createError(403,"You are not allowed to update this project!"))
                }
            }else{
                return next(createError(403,"You can update only if you are a member of this project!"))
            }
        }

    }catch(err){
        next(err)
    }
}

// mail with nodemailer
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.GMAIL_USERNAME,
        pass:process.env.GMAIL_PASS,
    },
    port:465,
    host:'smtp.gmail.com'

})

const inviteProjectMember=async(req,res,next)=>{
    const user=await UserModel.findById(req.user.id);;
    if(!user){
        return next(createError(404,"User not found"))
    }

    const project=await ProjectModel.findById(req.params.id);
    if(!project){
        return next(createError(404,"Project not found!"));
    }
    for(let i=0;i<project.members.length;i++){
        if(project.members[i].id===req.user.id){
            if(project.members[i].access==="Owner"|| project.members[i].access==="Admin"||project.members[i].access==="Editor"){
                const mailOptions={
                    from:process.env.Email,
                    to:req.body.email,
                    subject:"Project Invitation",
                    text:`Hi ${req.body.name}, you have been invited to join project ${project.title} by ${user.name}. Please click on the link to join the project. http://localhost:3000/api/project/invite/${req.params.id}/${req.body.id}`,
                };
                transporter.sendMail(mailOptions,(err,data)=>{
                    if(err){
                        return next(err);
                    }else{
                        res.status(200).json({message:"Message sendt successfully"})
                    }
                })
            }else{
                return next(createError(403,"Tou are not allowed to invite members to this project!"))
            }
        }
    }
}

module.exports={
    addWork,
    deleteProject,
    getProject,
    updateProject,
    inviteProjectMember,
}