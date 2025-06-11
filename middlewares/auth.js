// auth , isStudent , isAdmin
const jwt = require('jsonwebtoken');
require("dotenv").config();
exports.auth = (req, res, next) => {
    try{
        //extract jwt token 
        //Pending :: other ways to fetch token 
        console.log("cookie1", req.cookies);
        // console.log("body",  req.body.token);
        // console.log("header", req.header("Authorization"));
        console.log(req.body);
        const token = req.cookies.token;
        console.log(token);
        if(!token){
            return res.status(401).json({
                success: false, 
                message: "Token missing"
            })
        }

        //verify the token 
        console.log("reached");
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            //printing the payload 
            console.log("decode", decode);

            req.user = decode
            console.log("end")
        }catch(error){
            res.status(401).json({
                success: false,
                message: "Token is invalid",
            });
        }
        next();
    }
    catch(error){
        console.log(error);
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
                message: "This is a protected route for Admin",
            })
        }
        console.log("finish");
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false, 
            message: "User Role is not matching",
        })
    }
}

exports.isOrganization = (req, res, next) => {
    try{
        if(req.user.role != 'Organization'){
            res.status(401).json({
                success: false,
                message: "This is a protected route for Organizations",
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "User role not matching"
        })
    }
}


