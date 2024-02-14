const jwt=require("jsonwebtoken")
const {createError}=require("../error")


const verifyToken=async(req,res,next)=>{
    try{
        if(!req,headers.authorization) return next(createError(401,"You are not authenticated"));
        const token=req.headers.authorization.split(" ")[1];

        if(!token)return next(createError(401,"You are not authenticated!"));
        const decode=await jwt.verify(token,process.env.JWT_SECRET);
        req.user=decode;
        next()

    }catch(err){
        console.log(err);
        res.status(402).json({err:err.message})
    }

    
}

module.exports={
    verifyToken,
}