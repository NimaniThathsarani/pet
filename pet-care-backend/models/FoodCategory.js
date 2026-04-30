const mongoose = require('mongoose');

const foodCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },           // e.g. "High Protein", "Puppy Formula"
  nutritionalBenefits: { type: String, required: true }, // description of benefits
  suitableFor: { type: String },                    // e.g. "Adult dogs, active breeds"
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FoodCategory', foodCategorySchema);