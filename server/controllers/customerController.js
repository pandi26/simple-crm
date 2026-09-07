const Customer=require("../models/customer");

//create customer

const createCustomer = async (req, res)=>{
    try{
const {name, email, phone, company, status}=req.body;

if(!name||!email||!phone){
    return res.json({
        message:"name, email, phone are required",
    });
}
const customer =await Customer.create({
    name, 
    email,
    phone,
    company,
    status,
    createBy:req._id,

});

return res.status(201).json({
    message:"customer created successfully",
    customer,
});

    }
   catch (error){
    console.error("customer error",error.message);

    return res.status(500).json({
        message:error.message,
    });

   }

};

// Get All Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();

    return res.status(200).json({
      count: customers.length,
      customers,
    });

  } catch (error) {
    console.error("Get Customers Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

const getCustomerById= async (req, res)=>{
    try{
            const customer =await Customer.findById(req.param.id);

            if(!customer){
                return res.status(404).json({
                    message:"Customer not found",
                });
            }
            return res.status(200).json({
                customer,
            });
    }
    catch(error){
        return res.json({
            message:error.message,
        });
    }
};


const updateCustomer =async (req, res)=>{
    try{
        const  customer =await Customer.findByIdAndUpdate(
            req.param.id, 
            req.body,
            {
                new:true,
                runValidator:true,
            }

    );
    if(!customer){
        return res.status(404).json({
            message:"customer not found",
        });
    }
     return res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
}
      catch (error) {
    console.error("Update Customer Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Customer deleted successfully",
    });

  } catch (error) {
    console.error("Delete Customer Error:", error.message);

    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports={createCustomer,getCustomers,getCustomerById,updateCustomer,deleteCustomer,};