const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },  //id
  balance: { type: Number, default: 0 },                  //user bal
  lastDaily: { type: Date }                               //for tracking daily rewards
});

module.exports = mongoose.model('User', userSchema);