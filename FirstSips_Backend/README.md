# FirstSips Backend

This is the backend server for the FirstSips application, handling payment processing, Stripe Connect integration, and other server-side operations.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables (see `.env.example` for a template):
```
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Supabase Configuration
SUPABASE_URL=https://aebfwwdjqwhpjqnvnrno.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Server Configuration
PORT=5000
DOMAIN=http://localhost:5000

# Stripe Connect Configuration
STRIPE_REFRESH_URL=http://localhost:5000/stripe/refresh
STRIPE_RETURN_URL=http://localhost:5000/stripe/return
```

3. Start the server:
```bash
npm start
```

## API Endpoints

### Payments

- `POST /payments/payment-sheet`: Create a payment sheet for the mobile app
- `POST /payments/create-payment-intent`: Create a payment intent
- `POST /payments/webhook`: Webhook for Stripe events

### Stripe Connect

- `POST /stripe/create-account`: Create a Stripe Connect account for a shop owner
- `POST /stripe/create-onboarding-link`: Generate an onboarding link for a shop owner
- `GET /stripe/return`: Handle return from Stripe onboarding
- `GET /stripe/refresh`: Handle refresh/retry of Stripe onboarding
- `GET /stripe/check-account-status/:accountId`: Check the status of a Stripe Connect account
- `POST /stripe/webhook`: Webhook for Stripe Connect events

## Database Schema

The backend uses Supabase as the database. The following tables are required:

### shops
- `id`: UUID (primary key)
- `owner_id`: UUID (foreign key to users table)
- `shop_name`: String
- `description`: String
- `street_address`: String
- `city`: String
- `state`: String
- `zip_code`: String
- `phone_number`: String
- `stripe_account_id`: String
- `stripe_enabled`: Boolean
- `payouts_enabled`: Boolean
- `details_submitted`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp

### temp_stripe_data
- `id`: String (primary key, format: "stripe_{accountId}")
- `shop_id`: UUID (foreign key to shops table)
- `account_id`: String
- `created_at`: Timestamp
- `expires_at`: Timestamp

### orders
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users table)
- `shop_id`: UUID (foreign key to shops table)
- `payment_intent_id`: String
- `status`: String (pending, paid, completed, etc.)
- `total`: Decimal
- `pickup_time`: String
- `created_at`: Timestamp
- `updated_at`: Timestamp

### order_items
- `id`: UUID (primary key)
- `order_id`: UUID (foreign key to orders table)
- `item_id`: UUID (foreign key to items table)
- `quantity`: Integer
- `price`: Decimal
- `created_at`: Timestamp
