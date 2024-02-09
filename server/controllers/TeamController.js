const UserModel=require("../models/UserModel")
const ProjectModel=require("../models/project")
const TeamModel=require("../models/Teams")
const jwt=require("jsonwebtoken")
const {createError}=require("../error")
const nodemailer=require("nodemailer")
const otpGenerator=require("otp-generator")

const addTeam=async(req,res,next)=>{
    const user=await UserModel.findById(req.user.id);
    if(!user) return next(createError(404,"User not found"));

    const newTeams=new TeamModel({members:[{id:user.id,role:"d",access:"Owner"}],...req.body});
    try{
        const saveTeams=(await newTeams.save())
        UserModel.findByIdAndUpdate(user.id,{$push:{teams:saveTeams._id}},{new:true},(err,doc)=>{
            if(err){
                next(err)
            }
        });
        res.status(200).json(saveTeams);

    }catch(err){
        next(err)
    }
    
}

const deleteTeam=async(req,res,next)=>{
    try{
        const Team=await TeamModel.findById(req.params.id);
        if(!Team) return next(createError(404,"Team not found!"))
        for(let i=0;i<Team.members.length;i++){
            if(Team.members[i].id.roString()===req.user.id){
                if(Team.members[i].access==="Owner"){
                    await Team.delete();
                    UserModel.findByIdAndUpdate(req.user.id,{$pull:{teams:req.params.id}},{new:true}).exec();
                    for(let j=0;j<Team.members.length;j++){
                        UserModel.findByIdAndUpdate(Team.members[j].id,{$pull:{teams:req.params.id}},{new:true}).exec();
                    }
                    res.status(200).json("Team has been deleted!")
                }else{
                    return next(createError(403,"You are not allowed to delete this team!"))
                }
            }
        }

    }catch(err){
        next(err)
    }
}

const getTeam=async(req,res,next)=>{
    try{
        const team=await TeamModel.findById(req.params.id).populate("members.id","_id name email img").populate({
            path:"projects",
            populate:{
                path:"members.id",
                select:"_id name email",
            }
        });

        var verified=false;

        await Promise.all(team.members.map(async(Member)=>{
            if(Member.id.id===req.user.id)
            verified=true
        })).then(()=>{
            if(verified){
                res.status(200).json(team)
            }else{
                return next(createError(403,"You are not allowed to see this team!"))
            }
        })

    }catch(err){
        next(err)
    }
}

const updateTeam=async(req,res,next)=>{
    try{
        const Team=await TeamModel.findById(req.params.id);
        if(!Team) return next(createError(404,"Team not found!"))
        console.log(Team.members.length);
    if(Team.members[i].id.toString()===req.user.id){
        if(Team.members[i].access==="Owner"||Team.members[i].access==="Admin"||Team.members[i].access==="Editor"){
            const updatedTeam=await TeamModel.findByIdAndUpdate(req.params.id,{
                $set:req.body,
            },{new:true})
            res.status(200).json(updatedTeam)
        }else{
            return next(createError(403,"You are not allowed to update this Team!"))
        }
    }
    return next(createError(403,"You can update only if you a member of this team!"))

    }catch(err){
        next(err)
    }
}

const updateMembers=async(req,res,next)=>{
    try{
        const Team=await TeamModel.findById(req.params.id);
        if(!Team) return next(createError(404,"Team not found!"))
        for(let i=0;i<Team.members.length;i++){
            if(Team.members[i].id.toString()===req.user.id){
                if(Team.members[i].access==="Owner"|| Team.members[i].access==="Admin"|| Team.members[i].access==="Editor"){
                    await TeamModel.findByIdAndUpdate(req.params.id,{
                        $set:{
                            "members.$[elem].access":req.body.access,
                            "members.$[elem].role":req.body.role,
                        },
                    },{
                        arrayFilters:[{"elem.id":req.body.id}],
                        new:true,
                    });
                    res.status(200).json({message:"Member has been updated!"})
                }else{
                    return next(createError(403,"You are not allowed to update this Team"))
                }
            }
        }

        return next(createError(403,"You can update only if you are member of this team"))

    }catch(err){
        next(err)
    }
}

const removeMember=async(req,res,next)=>{
    try{
        const Team=await TeamModel.findById(req.params.id);
        if(!Team) return next(createError(404,"Teams not found!"))
        for(let i=0;i<Team.members.length;i++){
            console.log(Team.members.length,Team.members[i].id.toString(),req.user.id)
            if(Team.members[i].access==="Owner"|| Team.members[i].access==="Admin"||Team.members[i].access==="Editor"){
                await TeamModel.findByIdAndUpdate(
                    req.params.id,{
                        $pull:{members:{id:req.body.id}}
                    },
                    {
                        new:true,
                    }
                ).exec();
                await UserModel.findByIdAndUpdate(req.body.id,{$pull:{items:req.params.id}},{new:true}).exec().then(()=>{
                    res.status(200).json({message:"Member has been removed"})
                }).catch((err)=>{
                    next(err)
                })
            }else{
                return next(createError(403,"You are not allowed to update this team!"))
            }
        }
        return next(createError(403,"You can update only if you are member of this team!"))

    }catch(err){
        next(err)
    }
}

const addTeamProject=async(req,res,next)=>{
    const user=await UserModel.findById(req.user.id);
    if(!user){
        return next(createError(404,"User not found!"))
    }

    const newProject=new ProjectModel({members:[{id:user.id,role:"d",access:"Owner"}],...req.body});
    try{

        const saveProject=await (await newProject.save());
        UserModel.findByIdAndUpdate(user.id,{$push:{projects:saveProject._id}},{new:true},(err,doc)=>{
            if(err){
                next(err)
            }
        });
        TeamModel.findByIdAndUpdate(req.params.id,{$push:{projects:saveProject._id}},{new:true},(err,doc)=>{
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
    addTeam,
    deleteTeam,
    getTeam,
    updateTeam,
    updateMembers,
    removeMember,
    addTeamProject,
}