const mongoose=require("mongoose")


const WorksSchema=new mongoose.Schema({
    projectId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Projects",
        unique:false,
    },
    createdAt:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User",
        unique:false,
    },
    title:{
        type:String,
        required:true,
        unique:false,
    },
    desc:{
        type:String,
        required:true,
        unique:false,
    },
    priority:{
        type:String,
        required:true,
        default:"Low",
    },
    tags:{
        type:[String],
        default:[],
    },
    status:{
        type:String,
        required:true,
        default:"Working",
    },
    tasks:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:"Tags",
        default:[]
    }
},{timestamps:true});

module.exports=mongoose.model("Works",WorksSchema)