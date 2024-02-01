const mongoose=require("mongoose")

const TaskSchema=new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Projects",
        required: true,
        unique: false,
    },
    workId: { type: String, unique: false },
    task: { type: String, required: true },
    start_date: { type: String, required: true, default: "" },
    end_date: { type: String, required: true, default: "" },
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },
    status: { type: String, default: "Working" },
},
    { timestamps: true }
);

module.exports=mongoose.model("Task",TaskSchema)