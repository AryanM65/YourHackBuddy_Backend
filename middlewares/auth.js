// auth , isStudent , isAdmin
const jwt = require('jsonwebtoken');
require("dotenv").config();
exports.auth = (req, res, next) => {
    try{
        //extract jwt token 
        //Pending :: other ways to fetch token 
        console.log("cookie", req.cookies);
        console.log("body",  req.body.token);
        console.log("header", req.header("Authorization"));
        console.log(req.body);
        const token = req.body.token || req.cookies.token || req.header("Authorization").replace("Bearer ", "");

        if(!token){
            return res.status(401).json({
                success: false, 
                message: "Token missing"
            })
        }

        //verify the token 
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            //printing the payload 
            console.log("decode", decode);

            req.user = decode
        }catch(error){
            res.status(401).json({
                success: false,
                message: "Token is invalid",
            });
        }
        next();
    }
    catch(error){
        return res.status(401).json({
            success: false, 
            message: "Something went wrong while verifying this token"
        })
    }
}

//these two check authorization
exports.isStudent = (req, res, next) => {
    try{
        if(req.user.role != 'Student'){
            res.status(401).json({
                success: false, 
                message: "This is a protected route for students",
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false, 
            message: "User Role is not matching",
        })
    }
}


exports.isAdmin = (req, res, next) => {
    try{
        if(req.user.role != 'Admin'){
            res.status(401).json({
                success: false, 
                message: "This is a protected route for students",
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false, 
            message: "User Role is not matching",
        })
    }
}


