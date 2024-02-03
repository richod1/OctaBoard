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

const getTasks=async(req,res,next)=>{
    try{

        const user=await UserModel.findById(req.user.id).populate({
            path:"tasks",
            populate:{
                path:"members",
                select:"name img",
            }
        }).sort({end_date:1});
        if(!user) return next(createError(404,"User not found"));

        const tasksArray=[];
        await Promise.all(
            user.tasksArray.map(async (task)=>{
                tasksArray.push(task)
            }).then(()=>{
                res.status(200).json(tasksArray);
            })
        )
    }catch(err){
        next(err)
    }
}

const subscribe=async(req,res,next)=>{
    try{
        await UserModel.findByIdAndUpdate(req.user.id,{
            $push:{subscribedUsers:req.params.id}
        });

        await UserModel.findByIdAndUpdate(req.params.id,{
            $inc:{subscribers:1}
        });

        res.status(200).json("Subscription successfully!")

    }catch(err){
        next(err)
    }
}

const unsubscribe=async(req,res,next)=>{
    try{
        await UserModel.findByIdAndUpdate(req.params.id,{
            $pull:{subscibeUsers:req.params.id}
        });
        await UserModel.findByIdAndUpdate(req.params.id,{
            $inc:{subscribers:-1}
        })
        res.status(200).json("Unsubscription Successfully")

    }catch(err){
        next(err);
    }
}

// fincding project id from user and get it from projects collections
const getUserProjects=async(req,res,next)=>{
    try{
        const user=await UserModel.findById(req.user.id).populate("projects");

        const projects=[];
        await Promise.all(user.projects.map(async(project)=>{
            projects.push(project)
        })).catch((err)=>{
            next(err)
        }).then(()=>{
            res.status(200).json(projects)
        }).catch((err)=>{
            next(err)
        })
        // tried to avoid promise chain hell;

    }catch(err){
        next(err)
    }
}

const getUserTeams=async(req,res,next)=>{
    try{

        const user=await UserModel.findById(req.user.id).populate("teams");
        const teams=[];

        await Promise.all(user.teams.map(async(team)=>{
            await TeamsModel.findById(team.id).then((team)=>{
                teams.push(team)
            }).catch((err)=>{
                next(err);
            })
        })).then(()=>{
            res.status(200).json(teams)
        }).catch((err)=>{
            next(err)
        })

    }catch(err){
        next(err)
    }
}

const findUserByEmail=async(req,res,next)=>{
    const email=req.params.email;
    const users=[];
    try{
        await UserModel.findOne({email:{$regex:email,$options:"1"}}).then((user)=>{
            if(user !=null){
                users.push(user);
                res.status(200).json(users)
            }else{
                res.status(201).json({message:"User not found!"})
            }
        }).catch((err)=>{
            next(err)
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
    getWorks,
    getTasks,
    subscribe,
    unsubscribe,
    getUserProjects,
    getUserTeams,
    findUserByEmail,
}
