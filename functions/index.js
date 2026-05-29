import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import bibleHandler from '../api/bible.js';
import notifyHandler from '../api/notify.js';
import remindHandler from '../api/remind.js';
import subscribeHandler from '../api/subscribe.js';

const app = express();
app.use(express.json());

app.get('/bible', bibleHandler);
app.post('/subscribe', subscribeHandler);
app.post('/notify', notifyHandler);
app.post('/remind', remindHandler);

export const api = onRequest(app);
