const express=require('express');
const mongoose=require('mongoose');
const dotenv = require('dotenv');
const { Resend } = require('resend');
const cron = require('node-cron');
const path = require('path');
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING, {
    dbName:'chintu_emaildb'
});

const subscriberSchema = new mongoose.Schema({
    name: String,
    email: String
});
const Subscriber = mongoose.model('Subscriber', subscriberSchema);


const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/subscribe', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).send('Name and email are required');
    }
    try {
        // const existing = await Subscriber.findOne({ email });
        // if (!existing) 
        await Subscriber.create({ name, email });
        await resend.emails.send({
            from:"onboarding@resend.dev",
            to: email,
            subject: 'Welcome to our Newsletter!',
            text: `Hi ${name},\n\nThank you for subscribing! You will receive our emails every Sunday.`,
        });
        res.sendFile(path.join(__dirname, 'subscribed.html'));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error subscribing');
    }
});


cron.schedule('0 10 * * 0', async () => {
    const subscribers = await Subscriber.find();
    for (const sub of subscribers) {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: sub.email,
            subject: 'Your Weekly Newsletter',
            text: `Hello ${sub.name},\n\nHere is your weekly newsletter!`,
        });
    }
    console.log('Weekly emails sent');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('server is running');
});