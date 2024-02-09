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

// nodemailer init
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
    port:465,
    host:'smtp.gmail.com'
})

export const inviteTeamMember = async (req, res, next) => {
    //send mail using nodemailer

    const user = await UserModel.findById(req.user.id);
    if (!user) {
        return next(createError(404, "User not found"));
    }

    const team = await TeamModel.findById(req.params.id);
    if (!team) return next(createError(404, "Team not found!"));

    req.app.locals.CODE = await otpGenerator.generate(8, { upperCaseAlphabets: true, specialChars: true, lowerCaseAlphabets: true, digits: true, });

    const link = `${process.env.URL}/team/invite/${req.app.locals.CODE}?teamid=${req.params.id}&userid=${req.body.id}&access=${req.body.access}&role=${req.body.role}`;

    const mailBody = `
    <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHQMmI5x5qWbOrEuJuFWkSIBQoT_fFyoKOKYqOSoIvQ&s" alt="VEXA Logo" style="display: block; margin: 0 auto; max-width: 200px; margin-bottom: 20px;">
  <h1 style="font-size: 22px; font-weight: 500; color: #854CE6; text-align: center; margin-bottom: 30px;">${team.name}</h1>
  <div style="background-color: #FFF; border: 1px solid #e5e5e5; border-radius: 5px; box-shadow: 0px 3px 6px rgba(0,0,0,0.05);">
    <div style="background-color: #854CE6; border-top-left-radius: 5px; border-top-right-radius: 5px; padding: 20px 0;">
      <h2 style="font-size: 28px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 10px;">Invitation to Join Team: ${team.name}</h2>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">Dear ${req.body.name},</p>
      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">You have been invited to join a team <b>${team.name}</b> on VEXA by <b>${user.name}</b>. Please follow the link below to accept the invitation:</p>
      <div style="text-align: center;">
        <a href=${link} style="background-color: #854CE6; color: #FFF; text-decoration: none; font-size: 16px; font-weight: 500; padding: 10px 30px; border-radius: 5px;">Accept Invitation</a>
      </div>
      <p style="font-size: 16px; color: #666; margin-top: 30px;">Best regards,</p>
      <p style="font-size: 16px; color: #666;">The VEXA Team</p>
    </div>
  </div>
</div>
`;

    for (let i = 0; i < team.members.length; i++) {
        if (team.members[i].id.toString() === req.user.id) {
            if (team.members[i].access === "Owner" || team.members[i].access === "Admin" || team.members[i].access === "Editor") {

                const mailOptions = {
                    from: process.env.EMAIL,
                    to: req.body.email,
                    subject: `Invitation to join team ${team.name}`,
                    html: mailBody
                };
                transporter.sendMail(mailOptions, (err, data) => {
                    if (err) {
                        return next(err);
                    } else {
                        return res.status(200).json({ message: "Email sent successfully" });
                    }
                });
            } else {
                return next(createError(403, "You are not allowed to invite members to this project!"));
            }
        }
    }
};


const verifyInvitation=async (req,res,next)=>{
    try{
        const {teamid,userid,access,role}=req.query;
        const code=req.params.code;
        if(code===req.app.locals.CODE){
            req.app.locals.CODE=null;
            req.app.locals.resetSession=true;

            const team=await TeamModel.findById(teamid);
            if(!team) return next(createError(404,"Team not found!"))

            const user=await UserModel.findById(userid);
            if(!user) return next(createError(404,"User not found!"))

            for(let i=0;i<team.members.length;i++){
                if(team.members[i].id.toString()===user.id){
                    return next(createError(404,"Tou are already a member of this team"))
                }
            }

            const newMember={id:user.id,role:role,access:access};

            await TeamModel.findByIdAndUpdate(teamid,{
                $push:{members:newMember}
            },{
                new:true
            }).then(async ()=>{
                await UserModel.findByIdAndUpdate(userid,{
                    $push:{teams:team.id}
                },{new:true})
            }).then((result)=>{
                res.status(200).json({message:"You have successfully joined the team!"})
            }).catch((err)=>{
                next(err)
            })
        }
        return res.status(201).json({message:"Invalid-Link or Link expired"})

    }catch(err){
        next(err)
    }
}


const getTeamMembers=async (req,res,next)=>{
    try{
        const team=await TeamModel.findById(req.params.id);
        if(!team) return next(createError(404,"Team not found"))
        res.status(200).json(ream.members)

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
    inviteTeamMember,
    verifyInvitation,
    getTeamMembers,
}