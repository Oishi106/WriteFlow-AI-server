import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/env'; // Ensures central config object validation matching

const router = Router();

// Base universal header wrappers format matching bKash protocols standards
const getBkashHeaders = () => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    "username": config.bkash.username,
    "password": config.bkash.password
});

// 1. Grant Token Middleware Handler with Fallback Integration Logic
async function getBkashToken(req: Request, res: Response, next: NextFunction) {
    try {
        // Force fully bypass missing checks since we are already ensuring strings fallback inside config layer
        const response = await axios.post(
            `${config.bkash.baseUrl}/checkout/token/grant`,
            { 
                app_key: config.bkash.appKey, 
                app_secret: config.bkash.appSecret 
            },
            { headers: getBkashHeaders() }
        );
        
        if (response.data && response.data.id_token) {
            (req as any).bkashToken = response.data.id_token;
            next();
        } else {
            return res.status(401).json({ success: false, message: "bKash grant token validation response empty." });
        }
    } catch (error: any) {
        console.error("bKash Token Grant Execution Error Logs:", error.response?.data || error.message);
        return res.status(401).json({ success: false, message: "bKash Token generation failed" });
    }
}

// 2. Create Payment API Endpoint 
router.post('/create', getBkashToken, async (req: Request, res: Response) => {
    try {
        const token = (req as any).bkashToken;
        const { amount } = req.body;

        const response = await axios.post(
            `${config.bkash.baseUrl}/checkout/create`, 
            {
                mode: "0011",
                payerReference: "01723888888", 
                callbackURL: `${config.frontendUrl}/api/bkash/callback`, 
                amount: amount || "1900", 
                currency: "BDT",
                intent: "sale",
                merchantInvoiceNumber: "INV-" + Date.now()
            }, 
            {
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": token, 
                    "X-App-Key": config.bkash.appKey 
                }
            }
        );

        if (response.data && response.data.bkashURL) {
            return res.json({ success: true, bkashURL: response.data.bkashURL }); 
        } else {
            return res.status(400).json({ success: false, message: response.data.errorMessage || "Failed to parse checkout url path validation tracking" });
        }
    } catch (error: any) {
        console.error("bKash Create Payment Exception Output Trace:", error.response?.data || error.message);
        return res.status(500).json({ success: false, message: "Payment creation internally execution failed" });
    }
});

// 3. Callback Dynamic Redirect Endpoint
router.get('/callback', async (req: Request, res: Response) => {
    const { paymentID, status } = req.query;

    if (status === 'success' && typeof paymentID === 'string') {
        try {
            const auth = await axios.post(
                `${config.bkash.baseUrl}/checkout/token/grant`, 
                { app_key: config.bkash.appKey, app_secret: config.bkash.appSecret }, 
                { headers: getBkashHeaders() }
            );
            
            const executeResponse = await axios.post(
                `${config.bkash.baseUrl}/checkout/execute`, 
                { paymentID }, 
                { 
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": auth.data.id_token, 
                        "X-App-Key": config.bkash.appKey 
                    } 
                }
            );

            if (executeResponse.data && executeResponse.data.transactionStatus === 'Completed') {
                return res.redirect(`${config.frontendUrl}/payment-success?trxID=${executeResponse.data.trxID}`);
            } else {
                console.error("Payment status tracking response execution logs:", executeResponse.data);
                return res.redirect(`${config.frontendUrl}/payment-failed?reason=${executeResponse.data.errorMessage || 'uncompleted'}`);
            }
        } catch (err: any) {
            console.error("bKash Callback execute logic crash trace exceptions:", err.response?.data || err.message);
            return res.redirect(`${config.frontendUrl}/payment-failed`);
        }
    }
    return res.redirect(`${config.frontendUrl}/payment-failed`);
});

export default router;