const User = require('../models/user');
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const register=async(req,res)=>{
    try{
        let d=req.body;
        const exist=await User.findOne({email:d.email});
        if(exist){
            return res.status(400).json({error:"User already exists"});
        }
        
        bcrypt.hash(d.password,10,async(err,hash)=>{
            if(err){
                return res.status(500).json({error:err})
            }
            else{
                const user=await User.create({
                    name:d.name,
                    email:d.email,
                    password:hash
            
                })
                return res.status(201).json({message:"User created successfully"})
            }
        })
    }
    catch(err){
        return res.status(500).json({error:err})
    
    }
}

const login=async(req,res)=>{
    let dd=req.body;
    try{
        const user=await User.findOne({email:dd.email});
        if(!user){
            return res.status(400).json({error:"user not found"})
        }
        else{
            bcrypt.compare(dd.password,user.password,(err,result)=>{
                if(err){
                    return res.status(500).json({error:err})
                }
                else if(result){
                    jwt.sign({email:user.email,id:user._id},process.env.JWT_SECRET,{expiresIn:"1h"},(err,token)=>{
                        if(err){
                            return res.status(500).json({error:err})
                        }
                        else{
                            return res.status(200).json({message:"Login successful",token:token})
                        }
                
                    })
                }
                else{
                    return res.status(400).json({error:"Invalid password"})
                }
            })
        }

    }
    catch(err){
        return res.status(500).json({error:err})
    }
}


module.exports = { register, login };