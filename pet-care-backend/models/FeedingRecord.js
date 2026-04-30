const mongoose = require('mongoose');

const feedingEntrySchema = new mongoose.Schema({
  time: { type: String, required: true },     // e.g. "08:00 AM"
  portion: { type: String, required: true },  // e.g. "2 cups"
  notes: { type: String }                     // e.g. "mixed with wet food"
});

const feedingRecordSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  pet:      { type: mongoose.Schema.Types.ObjectId, ref: 'Pet',          required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodCategory', required: true },
  schedule: { type: [feedingEntrySchema], default: [] },  // daily feeding schedule
  startDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }             // currently following this plan
}, { timestamps: true });

module.exports = mongoose.model('FeedingRecord', feedingRecordSchema);