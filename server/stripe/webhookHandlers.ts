import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from '../storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Additionally handle checkout.session.completed for credit purchases
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return;

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        if (session.mode === 'payment' && session.payment_status === 'paid') {
          const userId = session.metadata?.userId;
          const credits = parseInt(session.metadata?.credits ?? '0', 10);
          if (userId && credits > 0) {
            await storage.addCredits(userId, credits, session.id);
          }
        }
      }
    } catch (err) {
      // Signature verification may have already been done by sync; log but don't throw
      console.error('Credit webhook processing error:', err);
    }
  }
}
