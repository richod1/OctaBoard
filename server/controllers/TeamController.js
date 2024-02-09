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

module.exports={
    addTeam,
    deleteTeam,
    getTeam,
}