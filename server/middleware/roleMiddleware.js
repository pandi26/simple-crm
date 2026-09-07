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
module.exports =(authorize);