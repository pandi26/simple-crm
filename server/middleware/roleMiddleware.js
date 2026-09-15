const authorize =(...role)=>{

    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({
                message:"Access denied.you dont have permission."
            });
        }
        next();

    };
};

const adminOnly=(req, res, next)=>{
    if(!req.user){
return res.status(401).json({
    message:"not Authorized",
});
    }

    if(req.user.role !=="admin"){
        return res.status(403).json({
            message:"access denied. admin only",
        });
    }
    next();
};


module.exports ={authorize,adminOnly};