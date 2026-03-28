const mongoose = require('mongoose')

const cropSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
    areaHa: { type: Number, default: 0 },
    season: { type: String, default: '' },
    expectedYieldKg: { type: Number, default: 0 },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Crop', cropSchema)

