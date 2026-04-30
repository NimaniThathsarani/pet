const FoodCategory = require('../models/FoodCategory');
const FeedingRecord = require('../models/FeedingRecord');
const Pet = require('../models/Pet');

// ─── ADMIN: Food Category Management ─────────────────────────────────────────

const createCategory = async (req, res) => {
  try {
    const { name, nutritionalBenefits, suitableFor } = req.body;
    if (!name || !nutritionalBenefits) {
      res.status(400); throw new Error('Name and nutritional benefits are required');
    }
    const cat = await FoodCategory.create({ name, nutritionalBenefits, suitableFor });
    res.status(201).json(cat);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const getCategories = async (req, res) => {
  try {
    const cats = await FoodCategory.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(cats);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const getAllCategories = async (req, res) => {
  try {
    const cats = await FoodCategory.find().sort({ name: 1 });
    res.status(200).json(cats);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const updateCategory = async (req, res) => {
  try {
    const cat = await FoodCategory.findById(req.params.id);
    if (!cat) { res.status(404); throw new Error('Category not found'); }
    const { name, nutritionalBenefits, suitableFor, isActive } = req.body;
    cat.name = name ?? cat.name;
    cat.nutritionalBenefits = nutritionalBenefits ?? cat.nutritionalBenefits;
    cat.suitableFor = suitableFor ?? cat.suitableFor;
    if (isActive !== undefined) cat.isActive = isActive;
    await cat.save();
    res.status(200).json(cat);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const deleteCategory = async (req, res) => {
  try {
    const cat = await FoodCategory.findById(req.params.id);
    if (!cat) { res.status(404); throw new Error('Category not found'); }
    await FoodCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted' });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// ─── USER: Feeding Records ────────────────────────────────────────────────────

const createFeedingRecord = async (req, res) => {
  try {
    const { petId, categoryId, schedule, startDate } = req.body;
    if (!petId || !categoryId || !schedule || schedule.length === 0) {
      res.status(400); throw new Error('Pet, category, and at least one feeding entry are required');
    }
    const pet = await Pet.findById(petId);
    if (!pet || pet.owner.toString() !== req.user._id.toString()) {
      res.status(401); throw new Error('Not authorized or pet not found');
    }
    const record = await FeedingRecord.create({
      owner: req.user._id,
      pet: petId,
      category: categoryId,
      schedule,
      startDate: startDate || new Date()
    });
    await record.populate('category');
    await record.populate('pet', 'name species');
    res.status(201).json(record);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const getMyFeedingRecords = async (req, res) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.petId) filter.pet = req.query.petId;
    const records = await FeedingRecord.find(filter)
      .populate('category')
      .populate('pet', 'name species')
      .sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const updateFeedingRecord = async (req, res) => {
  try {
    const record = await FeedingRecord.findById(req.params.id);
    if (!record) { res.status(404); throw new Error('Record not found'); }
    if (record.owner.toString() !== req.user._id.toString()) {
      res.status(401); throw new Error('Not authorized');
    }
    const { schedule, isActive } = req.body;
    if (schedule) record.schedule = schedule;
    if (isActive !== undefined) record.isActive = isActive;
    await record.save();
    res.status(200).json(record);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const deleteFeedingRecord = async (req, res) => {
  try {
    const record = await FeedingRecord.findById(req.params.id);
    if (!record) { res.status(404); throw new Error('Record not found'); }
    if (record.owner.toString() !== req.user._id.toString()) {
      res.status(401); throw new Error('Not authorized');
    }
    await FeedingRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Record deleted' });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

module.exports = {
  createCategory, getCategories, getAllCategories, updateCategory, deleteCategory,
  createFeedingRecord, getMyFeedingRecords, updateFeedingRecord, deleteFeedingRecord
};