const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const Mongoose = require('mongoose');
const CronJob = require('cron').CronJob;
const Config = require('./config.js');
const ProcessService = require('./services/AuditProcessService.js');
const Report = require('./models/Report.js');

// Mongoose
Mongoose.connect(Config.mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => console.log('MongoDB connected!'))
    .catch(e => console.log(e));

// Cron
const processReport = new CronJob('*/2 * * * *', async () => {
    console.log('Executing processReport Cron');
    const getMostRecent = await Report.findOne({ status: 0 }).catch((e) => console.log(e));
    if (getMostRecent) {
        console.log(getMostRecent);
        // Update Status
        await Report.findOneAndUpdate({ _id: getMostRecent._id }, { status: 1 }).catch((e) => console.log(e));

        // Process
        try {
            const process = await ProcessService.use(app.get('views'), getMostRecent.url, getMostRecent.firstName, getMostRecent.lastName, getMostRecent.emailAddress)
            if (process)
                await Report.findOneAndUpdate({ _id: getMostRecent._id }, { status: 2, statusMessage: "Completed" }).catch((e) => console.log(e));
            else 
                await Report.findOneAndUpdate({ _id: getMostRecent._id }, { status: 9, statusMessage: "Failed unexpected on else block" }).catch((e) => console.log(e));
        } catch (e) {
            console.log(e);
            await Report.findOneAndUpdate({ _id: getMostRecent._id }, { status: 9, statusMessage: "Failed on catch block" }).catch((e) => console.log(e));
        }
    }
});
processReport.start();

// Express
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => res.status(200).render('index'));
app.get('/thanks', (req, res) => res.status(200).render('thanks'));
app.post('/process_report', async (req, res) => {
    const { url, firstName, lastName, emailAddress } = req.body;

    if (!url || !emailAddress)
        return res.status(422).send({ error: "Please make sure your email address and website url are filled!" });

    const add = Report.create({ url, firstName, lastName, emailAddress }).catch((e) => console.log(e));
    if (add)
        return res.status(200).send({ message: "Added to audit queue!" });
    else 
        return res.status(200).send({ error: "An unexpected error happened, please try again later!" });
});

//ProcessService.use(app.get('views'), 'https://blackbeancreative.com', 'Cameron', 'Touchette', 'contact@cameronct.com');

server.listen(3000);
console.log('Server listening on Port ' + 3000);