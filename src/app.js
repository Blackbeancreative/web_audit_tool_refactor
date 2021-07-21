const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
const Config = require('./config.js');
const ProcessService = require('./services/AuditProcessService.js');
const Report = require('./models/Report.js');
const Mongoose = require('mongoose');

// Mongoose
Mongoose.connect(Config.mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => console.log('MongoDB connected!'))
    .catch(e => console.log(e));

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