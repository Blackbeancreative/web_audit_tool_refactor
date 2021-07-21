const Mongoose = require('mongoose');

const ReportSchema = new Mongoose.Schema({
    emailAddress: { type: "String", required: true },
    firstName: { type: "String", required: true },
    lastName: { type: "String", required: true },
    url: { type: "String", required: true },
    status: { type: "Number", required: true, default: 0 },
    statusMessage: { type: "String", required: true, default: "Normal" },
    created: { type: "Number", required: true, default: (new Date().getTime() / 1000) }
});
const Report = Mongoose.model('reports', ReportSchema);

module.exports = Report;