const mongoose=require("mongoose")


function connect(){
    mongoose.set('strictQuery',true);
mongoose.connect().then(()=>{
    console.log("Database connected sucess")
}).catch(err=>console.log("Database disconneted",err.message))
}

module.exports={
    connect
}