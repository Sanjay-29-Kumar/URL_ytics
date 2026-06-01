import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  longUrl: {
    type: String,
    required: [true, 'Destination URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clicksCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

urlSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (ret.userId) ret.userId = ret.userId.toString();
    return ret;
  }
});

// Indexes for fast lookups
urlSchema.index({ userId: 1 });

const Url = mongoose.model('Url', urlSchema);
export default Url;

