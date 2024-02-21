const express=require("express")
const app=express();
const port=3000;
const cookieParser=require("cookie-parser")
const cors=require("cors")
const morgan=require("morgan")
require("dotenv").config()
const {connect}=require("./Database/dataConnect")
const corsConfig={
    credentials:true,
    origin:true,

}
app.use(cors(corsConfig))
app.use(express.json())
app.use(morgan('tiny'))
app.disable('x-powered-by')
app.use(cookieParser())
const AuthRoute=require("./routes/auth")
const ProjectRoute=require("./routes/project")
const TeamRoute=require("./routes/teams")
const UserRoute=require("./routes/user")
// database connection
connect();

app.use((err,req,res,next)=>{
    const status=err.status||500;
    const message=err.message||'Something went wrong';
    return res.status(status).json({
        sucess:false,
        status,
        message,
    })
})

// test endpoint
app.get("/",(req,res)=>{
    res.send("Hello api")
})

// routes usage here
app.use("/api/auth",AuthRoute)
app.use("/api/users",UserRoute)
app.use("/api/project",ProjectRoute)
app.use("/api/team",TeamRoute)

app.listen(port,(err)=>{
    if(err) throw new Error("server is asleep");
    console.log(`Server is up on port ${port}`)
})