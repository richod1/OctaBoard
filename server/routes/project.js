const express=require("express")
const router=express.Router();

const {
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
    getWork
}=require("../controllers/ProjectController")
const {localVariables}=require("../middleware/auth")
const {verifyToken}=require("../middleware/verifyToken")


router.post("/", verifyToken, addProject);

router.get("/:id", verifyToken, getProject)

router.delete("/:id", verifyToken, deleteProject)

router.patch("/:id", verifyToken, updateProject)

router.patch("/member/:id", verifyToken, updateMembers)

router.patch("/member/remove/:id", verifyToken, removeMember)


router.post("/invite/:id", verifyToken, localVariables, inviteProjectMember)

router.get("/invite/:code", verifyInvitation)

router.get("/members/:id",verifyToken, getProjectMembers)


router.post("/works/:id", verifyToken, addWork)

router.get("/works/:id", verifyToken, getWork)