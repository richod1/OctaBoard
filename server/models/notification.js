const mongoose=require("mongoose")

const NotificationSchema=new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    link: {
        type: String,
    },
    type: { type: String, required: true },
},
    { timestamps: true }
);

module.exports=mongoose.model(NotificationSchema)