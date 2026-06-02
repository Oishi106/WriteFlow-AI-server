import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/env'; // Adjust your actual path relative depth if needed

const router = Router();

// Base universal header wrappers format matching bKash protocols standards
const getBkashHeaders = () => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    "username": config.bkash.username,
    "password": config.bkash.password
});

// 1. Grant Token Middleware Handler
async function getBkashToken(req: Request, res: Response, next: NextFunction) {
    try {
        const response = await axios.post(
            `${config.bkash.baseUrl}/checkout/token/grant`,
            { 
                app_key: config.bkash.appKey, 
                app_secret: config.bkash.appSecret 
            },
            { headers: getBkashHeaders() }
        );
        
        if (response.data && response.data.id_token) {
            // Bypass strict TypeScript object literal property injection mapping tracker
            (req as any).bkashToken = response.data.id_token;
            next();
        } else {
            res.status(401).json({ success: false, message: "bKash grant token validation response empty." });
        }
    } catch (error: any) {
        console.error("bKash Token Grant Execution Error Logs:", error.response?.data || error.message);
        res.status(401).json({ success: false, message: "bKash Token generation failed" });
    }
}

// 2. Create Payment API Endpoint 
router.post('/create', getBkashToken, async (req: Request, res: Response) => {
    try {
        const token = (req as any).bkashToken;
        const { amount } = req.body;

        const response = await axios.post(
            `${config.bkash.baseUrl}/checkout/create`, // Fixed: Official API creation contract path target mapping
            {
                mode: "0011",
                payerReference: "01723888888", // Sandbox test wallet tracking identification number target
                callbackURL: `${config.frontendUrl}/api/bkash/callback`, // Callback path tracking trigger interface wrapper map
                amount: amount || "1900", // Dynamic or fixed configuration tracking framework state setup 
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
            res.json({ success: true, bkashURL: response.data.bkashURL }); 
        } else {
            res.status(400).json({ success: false, message: response.data.errorMessage || "Failed to parse checkout url path validation tracking" });
        }
    } catch (error: any) {
        console.error("bKash Create Payment Exception Output Trace:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Payment creation internally execution failed" });
    }
});

// 3. Callback Dynamic Redirect Endpoint
router.get('/callback', async (req: Request, res: Response) => {
    const { paymentID, status } = req.query;

    if (status === 'success' && typeof paymentID === 'string') {
        try {
            // Re-grant or request authentication tracking token for server execution 
            const auth = await axios.post(
                `${config.bkash.baseUrl}/checkout/token/grant`, 
                { app_key: config.bkash.appKey, app_secret: config.bkash.appSecret }, 
                { headers: getBkashHeaders() }
            );
            
            const executeResponse = await axios.post(
                `${config.bkash.baseUrl}/checkout/execute`, // Fixed: Official verification pipeline path target context routing execution schema map 
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
                // 👉 Perform database updates or premium tier template authorization logic directly inside this execution frame sequence block here...
                return res.redirect(`${config.frontendUrl}/payment-success?trxID=${executeResponse.data.trxID}`);
            } else {
                console.error("Payment status tracking not completed target token trace response execution logs:", executeResponse.data);
                return res.redirect(`${config.frontendUrl}/payment-failed?reason=${executeResponse.data.errorMessage || 'uncompleted'}`);
            }
        } catch (err: any) {
            console.error("bKash Callback execute logic crash trace exceptions:", err.response?.data || err.message);
            return res.redirect(`${config.frontendUrl}/payment-failed`);
        }
    }
    res.redirect(`${config.frontendUrl}/payment-failed`);
});

export default router;