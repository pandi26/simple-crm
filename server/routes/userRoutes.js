const express =require("express");

const {
    registerUser,
  loginUser,
}=require("../controller/authController");

const {protect} =require("../middleware/authMiddleware");
const {authorize}=require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login",loginUser);

//protected route -any logged user
router.get(
    "/profile",
    protect,
    (req, res)=>{
        res.status(200).json({
            message:"profile accessed successfully",
            user: req.user
        });
    }
);

router.get({
    "/admin",
    protect,
    (req, res)=>{
        res.status(200).json({
            message:"admin accessed successfully",
        });
    }
});

router.ger({
    "/sales",
    protect
    (req, res)=>{
        res.status(200).json({
            message:"sales accessed successfully",
        })
    }
});

module.exports= router;

