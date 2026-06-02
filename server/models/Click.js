import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    index: true
  },
  ip: {
    type: String,
    default: 'unknown'
  },
  referrer: {
    type: String,
    default: 'direct'
  },
  userAgent: {
    type: String,
    default: 'unknown'
  },
  device: {
    type: String,
    default: 'desktop'
  },
  browser: {
    type: String,
    default: 'unknown'
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

clickSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (ret.urlId) ret.urlId = ret.urlId.toString();
    return ret;
  }
});

const Click = mongoose.model('Click', clickSchema);
export default Click;

