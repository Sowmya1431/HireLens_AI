const mongoose = require('mongoose');
const userschema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        unique:true,
        required:true,},
        password:{
            type:String,
            required:true,
            minlength:6,
            maxlength:125
            
        },
    },{
        timestamps:true
    }
    
);
module.exports=mongoose.model("User", userschema)