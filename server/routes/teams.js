const express=require("express")
const router=expres.Router();
const {verifyToken} =require("../middleware/verifyToken")
const {localVariables}=require("../middleware/auth")
const {
    addTeam,
    deleteTeam,
    getTeam,
    updateTeam,
    updateMembers,
    removeMember,
    addTeamProject,
    inviteTeamMember,
    verifyInvitation,
    getTeamMembers
}=require("../controllers/TeamController")


router.post("/",verifyToken,addTeam);

router.get("/:id",verifyToken,getTeam);


router.delete("/:id",verifyToken,deleteTeam);

router.patch("/:id",verifyToken,updateTeam)

router.patch("/members/:id",verifyToken,updateMembers);

router.patch("/members/remove/:id",verifyToken,removeMember);

router.post("/addProject/:id",verifyToken,addTeamProject);

router.get("/invite/:code",verifyInvitation);

router.post("/invite/:id",verifyToken,localVariables,inviteTeamMember)


router.get("/members/:id",verifyToken,getTeamMembers);

