const mongoose = require("mongoose");

const customerInfo = new mongoose.Schema({
  Name: String,
  Age: Number,
  phone: String,
  email: String,
  preference_tags: [String],
});

const customerModel = mongoose.model("enduser-data", customerInfo);

module.exports = customerModel;
