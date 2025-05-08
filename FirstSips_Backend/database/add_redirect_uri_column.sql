-- Add redirect_uri column to temp_stripe_data table
ALTER TABLE temp_stripe_data 
ADD COLUMN redirect_uri TEXT;

-- This column will store the original redirect URI from the app
-- so we can redirect back to it after Stripe completes the onboarding process
