import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/env';

const router = Router();

type BkashRequest = Request & { bkashToken?: string };

const getBkashHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  username: config.bkash.username,
  password: config.bkash.password,
});

const hasValidBkashConfig = () => {
  const { appKey, appSecret, username, password, baseUrl } = config.bkash;
  if (!appKey || !appSecret || !username || !password || !baseUrl) {
    return false;
  }
  return true;
};

const ensureBkashEnv = (_req: Request, res: Response, next: NextFunction) => {
  if (!hasValidBkashConfig()) {
    return res.status(500).json({
      success: false,
      message: 'bKash env config missing. Set BKASH_* variables.',
    });
  }
  next();
};

async function getBkashToken(req: BkashRequest, res: Response, next: NextFunction) {
  try {
    const response = await axios.post(
      `${config.bkash.baseUrl}/checkout/token/grant`,
      {
        app_key: config.bkash.appKey,
        app_secret: config.bkash.appSecret,
      },
      { headers: getBkashHeaders() }
    );

    if (response.data?.id_token) {
      req.bkashToken = response.data.id_token as string;
      return next();
    }

    return res.status(401).json({ success: false, message: 'bKash token response was empty.' });
  } catch (error: any) {
    console.error('bKash token grant failed:', error.response?.data || error.message);
    return res.status(401).json({
      success: false,
      message: error.response?.data?.errorMessage || 'bKash token generation failed.',
    });
  }
}

const createPayment = async (req: BkashRequest, res: Response) => {
  try {
    const token = req.bkashToken;
    const amount = Number(req.body?.amount) > 0 ? String(req.body.amount) : '1900';
    const callbackURL = `${req.protocol}://${req.get('host')}/api/bkash/callback`;

    const response = await axios.post(
      `${config.bkash.baseUrl}/checkout/create`,
      {
        mode: '0011',
        payerReference: '01723888888',
        callbackURL,
        amount,
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `INV-${Date.now()}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: token,
          'X-App-Key': config.bkash.appKey,
        },
      }
    );

    if (response.data?.bkashURL) {
      return res.json({ success: true, bkashURL: response.data.bkashURL });
    }

    return res.status(400).json({
      success: false,
      message: response.data?.errorMessage || 'Failed to create bKash session.',
    });
  } catch (error: any) {
    console.error('bKash create payment failed:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.errorMessage || 'bKash payment create failed.',
    });
  }
};

router.post('/session', ensureBkashEnv, getBkashToken, createPayment);
router.post('/create', ensureBkashEnv, getBkashToken, createPayment);

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
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: auth.data.id_token,
            'X-App-Key': config.bkash.appKey,
          },
        }
      );

      if (executeResponse.data?.transactionStatus === 'Completed') {
        return res.redirect(`${config.frontendUrl}/payment-success?trxID=${executeResponse.data.trxID}`);
      }

      console.error('bKash execute returned non-completed status:', executeResponse.data);
      return res.redirect(
        `${config.frontendUrl}/payment-failed?reason=${executeResponse.data?.errorMessage || 'uncompleted'}`
      );
    } catch (err: any) {
      console.error('bKash callback execute failed:', err.response?.data || err.message);
      return res.redirect(`${config.frontendUrl}/payment-failed`);
    }
  }

  return res.redirect(`${config.frontendUrl}/payment-failed`);
});

export default router;