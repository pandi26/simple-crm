const express =require("express");
const cors =require("cors");
const dotenv = require('dotenv');
const connectDB =require('./config/db');
const authRoutes=require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const leadRoutes = require("./routes/leadRoutes");

dotenv.config();
const app = express();

connectDB();

//middleware
app.use(cors());
app.use(express.json());

//route
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/leads", leadRoutes);



//test route
app.get('/',(req, res)=>{
    res.json({
        message:"CRM backend is running successfully",
    });
});
const PORT =process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server is running on this ${PORT}`);
});
