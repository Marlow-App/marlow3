import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.list({ limit: 100 });
  const existingNames = existingProducts.data.map(p => p.name);

  if (!existingNames.includes('Pro Starter')) {
    const starterProduct = await stripe.products.create({
      name: 'Pro Starter',
      description: 'Up to 5 recordings per day with 24-hour feedback guarantee',
      metadata: {
        tier: 'starter',
        daily_limit: '5',
        feedback_hours: '24',
      },
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 499,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    console.log(`Created Pro Starter: ${starterProduct.id}, Price: ${starterPrice.id}`);
  } else {
    console.log('Pro Starter already exists, skipping.');
  }

  if (!existingNames.includes('Pro Max')) {
    const maxProduct = await stripe.products.create({
      name: 'Pro Max',
      description: 'Up to 15 recordings per day with priority 24-hour feedback',
      metadata: {
        tier: 'max',
        daily_limit: '15',
        feedback_hours: '24',
      },
    });

    const maxPrice = await stripe.prices.create({
      product: maxProduct.id,
      unit_amount: 999,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    console.log(`Created Pro Max: ${maxProduct.id}, Price: ${maxPrice.id}`);
  } else {
    console.log('Pro Max already exists, skipping.');
  }

  console.log('Done seeding products!');
}

createProducts().catch(console.error);
