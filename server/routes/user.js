const express=require("express")
const router=express.Router();
const {verifyToken}=require("../middleware/verifyToken")
const {localVariables}=require("../middleware/auth")


const {
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
    findUserByEmail
}=require("../controllers/UserController")

// route endpoint for user


router.put("/:id",verifyToken,update);

router.delete("/:id",verifyToken,deleteUser)

router.get("/find/:id",verifyToken,findUser);

router.get("/find",verifyToken,getUser);

router.get("/projects",verifyToken,getUserProjects)

router.get("/teams",verifyToken,getUserTeams)

router.get("/search/:email",verifyToken,findUserByEmail)


router.get("/notifications",verifyToken,getNotification)


router.get("/works",verifyToken,getWorks)

router.get("/tasks",verifyToken,getTasks)


module.exports=router;