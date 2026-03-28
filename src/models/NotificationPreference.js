const mongoose = require('mongoose')

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: 'User' },
    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema,
)

