    const mongoose = require("mongoose");

    const customerSchema= new mongoose.Schema({
        name:{
            type:String,
            required:[true, "enter the name"],
            trim:true,
        },
        email:{
            type:String,
            required:[true, "enter the email"],
            trim:true,
            lowercase:true,
        },
        phone:{
            type:String,
            required:[true, "enter the phone number"],
            

        },
        company:{
            type:String,
            trim:true,
        },
        status:{
            type:String,
            enum:["active","Inactive"],
            default:"active",

        },
        role:{
           type:String,
           enum:["user","Admin"],
           default:"user",
        },
        createdBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,

        },
    },
{
    timestamp:true,
}

);

module.exports =mongoose.model("Customer", customerSchema);