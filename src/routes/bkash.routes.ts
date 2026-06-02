import express from 'express';
import axios from 'axios';

const router = express.Router();

// 1. Grant Token Middleware
async function getBkashToken(req, res, next) {
    try {
        const response = await axios.post(
            `${process.env.BKASH_BASE_URL}/checkout/token/grant`,
            { 
                app_key: process.env.BKASH_APP_KEY, 
                app_secret: process.env.BKASH_APP_SECRET 
            },
            { 
                headers: { 
                    "username": process.env.BKASH_USERNAME, 
                    "password": process.env.BKASH_PASSWORD 
                } 
            }
        );
        req.bkashToken = response.data.id_token;
        next();
    } catch (error) {
        console.error("bKash Token Grant Error:", error.response?.data || error.message);
        res.status(401).json({ success: false, message: "bKash Token generation failed" });
    }
}

// 2. Create Payment API Endpoint
router.post('/create', getBkashToken, async (req, res) => {
    try {
        const response = await axios.post(
            `${process.env.BKASH_BASE_URL}/checkout/payment/create`, 
            {
                mode: "0011",
                payerReference: "01723888888",
                callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/bkash/callback`, 
                amount: req.body.amount || "500", // Dynamic price configuration runtime input payload pass logic
                currency: "BDT",
                intent: "sale",
                merchantInvoiceNumber: "INV-" + Date.now()
            }, 
            {
                headers: { 
                    Authorization: req.bkashToken, 
                    "X-App-Key": process.env.BKASH_APP_KEY 
                }
            }
        );

        res.json({ success: true, bkashURL: response.data.bkashURL }); 
    } catch (error) {
        console.error("bKash Create Payment Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Payment creation failed" });
    }
});

// 3. Callback Dynamic Endpoint
router.get('/callback', async (req, res) => {
    const { paymentID, status } = req.query;

    if (status === 'success') {
        try {
            const auth = await axios.post(`${process.env.BKASH_BASE_URL}/checkout/token/grant`, { app_key: process.env.BKASH_APP_KEY, app_secret: process.env.BKASH_APP_SECRET }, { headers: { username: process.env.BKASH_USERNAME, password: process.env.BKASH_PASSWORD } });
            
            const executeResponse = await axios.post(
                `${process.env.BKASH_BASE_URL}/checkout/payment/execute`, 
                { paymentID }, 
                { headers: { Authorization: auth.data.id_token, "X-App-Key": process.env.BKASH_APP_KEY } }
            );

            if (executeResponse.data.transactionStatus === 'Completed') {
                // DB updates and order flow validation operations can be handled here execution line text
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-success?trxID=${executeResponse.data.trxID}`);
            }
        } catch (err) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-failed`);
        }
    }
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment-failed`);
});

export default router;