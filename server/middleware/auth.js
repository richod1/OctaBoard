function localVaribles(req,res,next){
    res.app.locals={
        OTP:null,
        resetSession:false,
        CODE:null
    }
    next()
}

module.exports={
    localVaribles
}