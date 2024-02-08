const UserModel=require("../models/project")
const jwt=require("jsonwebtoken")
const TaskModel=require("../models/Task")
const WorkModel=require("../models/Works")
const TeamModel=require("../models/Teams")
const Notification=require("../models/notification")
const ProjectModel=require("../models/project")
const otpgenerator=require("otp-generator")
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
            const updateproject=await ProjectModel.findByIdAndUpdate(
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

const updateMembers=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"project not found!"))
        for(let i=0;i<project.members.length;i++){
            if(project.members[i].id.toString()===req.user.id.toString()){
                if(project.members[i].access==="Owner"||project.members[i].access==="Admin"||project.members[i].access==="Editor"){
                    const updateproject=await ProjectModel.findByIdAndUpdate(
                        req.params.id,{
                            $set:{
                                "members.$[elem].access":req.body.access,
                                "members.$[elem].role":req.body.role,
                            }
                        },{
                            arrayFilters:[{"elem.id":req.body.id}],
                            new:true,
                        }
                    );
                    res.status(200).json({message:"member has been updated..."})
                }else{
                    return next(createError(403,"You are not allowed to update this project"))
                }
            }
    }

    return next(createError(403,"You can update only if you are a member of this project!"))

    }catch(err){
        next(err)
    }
}

const removeMember=async(req,res,next)=>{
    try{
        const project=await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"Member not found!"))
        for(let i=0;i<project.members.length;i++){
            if(project.members[i].id.toString()===req.uer.id.toString()){
                if(project.members[i].access==="Owner"||project.members[i].access==="Admin"||project.members[i].access==="Editor"){
                    await ProjectModel.findByIdAndUpdate(req.params.id,{$pull:{members:{id:req.body.id}}},{new:true,}).exec()

                    await UserModel.findByIdAndUpdate(req.body.id,{$pull:{projects:req.params.id}},{new:true}).exec()
                    .then((user)=>{
                        res.status(200).json({message:"Member has been removed..."})
                    }).catch((err)=>{
                        console.log(err)
                    })
                }
            }else{
                return next(createError(403,"You are not allowed to update this project"))
            }
        }
        return next(createError(403,"You can update only if you are a member of this project!"))

    }catch(err){
        next(err)
    }
}

// email temp with nodemailer
consttransporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    },
    port:465,
    host:'smtp.gmail.com'
})

const inviteProjectMember = async (req, res, next) => {
    //send mail using nodemailer
    const user = await UserModel.findById(req.user.id);
    if (!user) {
    return next(createError(404, "User not found"));
    }
    const project = await ProjectModel.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found!"));

    req.app.locals.CODE = await otpgenerator.generate(8, { upperCaseAlphabets: true, specialChars: true, lowerCaseAlphabets: true, digits: true, });
    dotenv.config();
    const link = `${process.env.URL}/projects/invite/${req.app.locals.CODE}?projectid=${req.params.id}&userid=${req.body.id}&access=${req.body.access}&role=${req.body.role}`;
    const mailBody = `
    <div style="font-family: Poppins, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHQMmI5x5qWbOrEuJuFWkSIBQoT_fFyoKOKYqOSoIvQ&s" alt="VEXA Logo" style="display: block; margin: 0 auto; max-width: 200px; margin-bottom: 20px;">
    <h1 style="font-size: 22px; font-weight: 500; color: #854CE6; text-align: center; margin-bottom: 30px;">Invitation to join a VEXA Project</h1>
    <div style="background-color: #FFF; border: 1px solid #e5e5e5; border-radius: 5px; box-shadow: 0px 3px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #854CE6; border-top-left-radius: 5px; border-top-right-radius: 5px; padding: 20px 0;">
            <h2 style="font-size: 28px; font-weight: 500; color: #FFF; text-align: center; margin-bottom: 10px;"><b>${project.title}</b></h2>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Hello ${req.body.name},</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">You've been invited to join a project called <b>${project.title}</b> on VEXA by <b>${user.name}</b>.</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">To accept the invitation and join the project, please click on the button below:</p>
            <div style="text-align: center; margin-bottom: 30px;">
                <a href=${link} style="background-color: #854CE6; color: #FFF; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you have any questions or issues with joining the project, please contact  <b>${user.name}</b> for assistance.</p>
        </div>
    </div>
    <br>
    <p style="font-size: 16px; color: #666; margin-top: 30px;">Best regards,</p>
    <p style="font-size: 16px; color: #666; margin-bottom: 20px; text-align: center;">Best regards,<br>The VEXA Team</p>
</div>
`

    for (let i = 0; i < project.members.length; i++) {
    if (project.members[i].id.toString() === req.user.id) {
        if (project.members[i].access.toString() === "Owner" || project.members[i].access.toString() === "Admin" || project.members[i].access.toString() === "Editor") {
        const mailOptions = {
            from: process.env.EMAIL,
            to: req.body.email,
            subject: `Invitation to join project ${project.title}`,
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

const verifyInvitation=async(req,res,next)=>{
    try{
        const {projectid,userid,access,role}=req.query;
        const code=req.params.code;
        if(code===req.app.locals.CODE){
            req.app.locals.CODE=null;
            req.app.locals.resetSession=true;

            const project=await ProjectModel.findById(projectid);
            if(!project) return next(createError(404,"Project not found!"))
            const user=await UserModel.findById(userid);
        if(!user) {
            return next(createError(404,"User not found!"))
        }

        for(let i=0;i<project.members.length;i++){
            if(project.members[i].id===user.id){
                return next(createError(403,"You are already a member of this project"))
            }
        }

        const newMember={id:user.id,role:role,access:access}
        const updatedProject=await ProjectModel.findByIdAndUpdate(projectid,{
            $push:{members:newMember}
        },{new:true});

        UserModel.findByIdAndUpdate(user.id,{$push:{projects:updatedProject._id}},{new:true},(err,doc)=>{
            if(err){
                next(err)
            }
        })

        res.status(200).json({message:"You have joined the ptoject Successfully"})
        }
        return res.status(201).json({message:"Invalid Link || Link expired!"})

    }catch(err){
        next(err)
    }
}

const getProjectMembers=async(req,res,next)=>{
    try{

        const project=await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"Project not found"));
        res.status(200).json(project.members);

    }catch(err){
        next(err)
    }
}

//add works to project
export const addWork = async (req, res, next) => {
    try {
    const user = await UserModel.findById(req.user.id);
    const project = await ProjectModel.findById(req.params.id);
    if (!project) return next(createError(404, "Project not found!"));
    for (let i = 0; i < project.members.length; i++) {
        if (project.members[i].id.toString() === req.user.id) {
        if (project.members[i].access === "Owner" || project.members[i].access === "Admin" || project.members[i].access === "Editor") {

            console.log("tg");
            //create tasks from the arrya of tasks or req.body.tasks and thne push the id of the tasks to the work

            const tasks = [];
            for (let i = 0; i < req.body.tasks.length; i++) {
            const newTask = new TaskModel({
                ...req.body.tasks[i],
                task: req.body.tasks[i].task,
                start_date: req.body.tasks[i].start_date,
                end_date: req.body.tasks[i].end_date,
                members: req.body.tasks[i].members,
                projectId: project._id,
            });
            const task = await newTask.save();
            tasks.push(task.id);
            }
            const newWork = new WorkModel({
            ...req.body,
            title: req.body.title,
            desc: req.body.desc,
            priority: req.body.priority,
            tags: req.body.tags,
            projectId: project._id,
            creatorId: user.id,
            tasks: tasks,
            });
            const work = await newWork.save();
            console.log(work);
            //add the work id to the tasks
            for (let i = 0; i < tasks.length; i++) {
            TaskModel.findByIdAndUpdate(tasks[i], { workId: newWork._id }, (err, doc) => {
                if (err) {
                next(err);
                }
            });
            }
            //add the work id to the project
            const updatedProject = await ProjectModel.findByIdAndUpdate(
            req.params.id,
            {
                $push: { works: work._id },
            },
            { new: true }
            ).then(() => {
              //add the work id to the members and the tasks
            for (let k = 0; k < req.body.tasks.length; k++) {
                for (let i = 0; i < req.body.tasks[k].members.length; i++) {
                const user = UserModel.findByIdAndUpdate(req.body.tasks[k].members[i], { $push: { works: work._id } }, (err, doc) => {
                    if (err) {
                    next(err);
                    }
                });

                for (let i = 0; i < tasks.length; i++) {
                    UserModel.findByIdAndUpdate(req.body.tasks[k].members[i], { $push: { tasks: tasks[i] } }, (err, doc) => {
                    if (err) {
                        next(err);
                    }
                    }
                    );
                }
                }

            }
            });
            for (let k = 0; k < req.body.tasks.length; k++) {
            for (let i = 0; i < req.body.tasks[k].members.length; i++) {
                const newNotification = new Notification({
                link: project.id,
                type: "task",
                message: `"${user.name}" added you to task "${req.body.tasks[k].task}" in work "${work.title}" in project "${project.title.toUpperCase()}".`,
                });
                const notification = await newNotification.save();

                console.log(notification);
                UserModel.findByIdAndUpdate(req
                .body.tasks[k].members[i], { $push: { notifications: notification._id } }, (err, doc) => {
                    if (err) {

                    next(err);
                    }
                }
                );
            }
            }

            res.status(200).json(updateProject);
        } else {
            return res.status(403).send({
            message: "You are not allowed to add works to this project"
            });
        }
        }
}
    } catch (err) {
    next(err);
    }
};

const getWork=async(req,res,next)=>{
    try{

        const project =await ProjectModel.findById(req.params.id);
        if(!project) return next(createError(404,"Project not found!"));
        const works=await WorkModel.find({projectId:req.params.id}).populate("tasks").populate("createorId","name img")
        .populate({
            path:"tasks",
            populate:{
                path:"members",
                select:"name img",
            }
        }).sort({createdAt:-1});
        res.status(200).json(works)

    }catch(err){
        next(err)
    }
}

module.exports={
    addProject,
    deleteProject,
    getProject,
    updateProject,
    updateMembers,
    removeMember,
    inviteProjectMember,
    verifyInvitation,
    getProjectMembers,
    addWork,
    getWork,
}