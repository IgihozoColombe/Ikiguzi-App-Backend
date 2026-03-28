const mongoose = require('mongoose')

const costEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
    cropId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Crop' },
    category: {
      type: String,
      required: true,
      enum: ['seeds', 'fertilizer', 'labor', 'pesticide', 'irrigation', 'transport', 'other'],
    },
    amountRwf: { type: Number, required: true, min: 0 },
    note: { type: String, default: '' },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

module.exports = mongoose.model('CostEntry', costEntrySchema)

