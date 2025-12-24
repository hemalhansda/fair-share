# Phone Authentication Setup Guide

This guide will help you set up phone number authentication using Supabase's built-in phone auth feature.

## Overview

The app now supports two authentication methods:
1. **Google OAuth** - Existing method
2. **Phone Number (SMS OTP)** - New method using Supabase + Twilio

## Prerequisites

- Supabase project (you already have this)
- Twilio account (free tier available)

## Setup Steps

### Step 1: Create a Twilio Account

1. Go to [Twilio Sign Up](https://www.twilio.com/try-twilio)
2. Create a free account (no credit card required for trial)
3. Complete the verification process
4. You'll receive **$15.50 in free credits** for testing

### Step 2: Get Twilio Credentials

1. After logging in, go to your [Twilio Console Dashboard](https://console.twilio.com/)
2. Find and copy these three values:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
   - **Twilio Phone Number** (you'll need to get one in the next step)

### Step 3: Get a Twilio Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country:
   - **US (Recommended)**: Numbers available immediately on free trial
   - **India**: ⚠️ **Not available on trial accounts** due to regulatory requirements
   - **Other countries**: Availability varies by region

3. Search for available numbers
4. Choose a number with **SMS capabilities**
5. Click **Buy** (it's free on trial account for supported countries)
6. Copy your Twilio phone number (format: `+1XXXXXXXXXX` for US)

#### 🇮🇳 Special Note for India

**Twilio does not provide Indian phone numbers on trial accounts** due to India's telecom regulations. You have three options:

**Option 1: Use a US Number (Recommended for Development)**
- Get a US number (`+1`) from Twilio (available on trial)
- Send OTP to ANY phone number worldwide, including Indian numbers (+91)
- The sender number will show as US, but recipients in India will receive SMS
- **This is the easiest option for testing**

**Option 2: Upgrade to Paid Twilio Account + Indian Regulatory Bundle**
- Upgrade your Twilio account (requires payment method)
- Complete India's regulatory requirements:
  - Register your business with Twilio
  - Submit KYC documents
  - Get DLT (Distributed Ledger Technology) registration
  - Purchase Principal Entity ID and DLT Sender ID
- **Cost**: ~₹10,000-20,000 for compliance + SMS costs
- **Timeline**: 2-4 weeks for approval
- **Only needed for production with Indian sender numbers**

**Option 3: Use Alternative SMS Provider for India**
- **MSG91**: Popular in India, easier compliance
- **Kaleyra**: India-focused SMS provider
- **Note**: Requires custom implementation (not directly supported by Supabase)

### Step 4: Configure Supabase

**Important**: Supabase now requires a Twilio Message Service SID. You'll need to create one first (see instructions below).

#### 4A: Create a Twilio Messaging Service

1. In Twilio Console, go to **Messaging** → **Services**
2. Click **Create Messaging Service**
3. Enter a friendly name: `fyrShare Auth` (or any name you prefer)
4. Click **Create Messaging Service**
5. On the next page, configure:
   - **Use case**: Select **Notify my users**
   - Click **Next**
6. Add Sender Pool:
   - Click **Add Senders**
   - Select **Phone Number**
   - Choose your Twilio phone number from the list
   - Click **Add Phone Numbers**
7. Configure integration (optional):
   - You can skip this - just click **Next** or **Skip Setup**
8. **Copy the Messaging Service SID** (starts with `MG...`)
   - You'll find this at the top of the page
   - It looks like: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 4B: Configure Phone Provider in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (`fair-share` or your project name)
3. Navigate to **Authentication** → **Providers**
4. Find **Phone** in the list of providers
5. Click to expand it and toggle **Enable Phone provider** to ON
6. Enter your Twilio credentials:
   - **Twilio Account SID**: Paste your Account SID (starts with `AC...`)
   - **Twilio Auth Token**: Paste your Auth Token
   - **Twilio Message Service SID**: Paste your Messaging Service SID (starts with `MG...`)
     - ⚠️ **Required field** - create one using the instructions above
   - **Twilio Sender Number**: Leave this **blank** when using Message Service SID
     - The phone number is already configured in the Messaging Service
7. Scroll down and configure these settings:
   - **Phone OTP Expiry**: `60` (seconds)
   - **Phone OTP Length**: `6` (digits)
   - **Phone Template**: Leave default or customize:
     ```
     Your fyrShare verification code is: {{ .Token }}
     ```
8. Click **Save**

**✅ Configuration Complete!** Your Twilio Messaging Service is now connected to Supabase.

### Step 5: Test Phone Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app and you should see two authentication options:
   - Continue with Google
   - Continue with Phone

3. Click **Continue with Phone**

4. Enter a valid phone number in international format (e.g., `+1 (555) 555-5555`)
   - **For testing with Twilio trial**: You must use a verified phone number
   - **US numbers**: Work immediately after verification
   - **Indian numbers** (`+91`): Will receive SMS even from US Twilio number
   - To verify a phone number: Go to Twilio Console → Phone Numbers → Manage → Verified Caller IDs

5. Click **Send Verification Code**

6. You should receive an SMS with a 6-digit code

7. Enter the code and click **Verify Code**

8. You should be logged in successfully!

## Twilio Free Tier Limits

- **$15.50 free credit** (enough for ~500 SMS messages)
- **SMS cost**: ~$0.0075 per message in the US
- Can only send to **verified phone numbers** on trial account
- To send to any number, upgrade to a paid plan (pay-as-you-go, no monthly fee)

## Verifying Phone Numbers for Testing (Trial Account)

Since Twilio trial accounts can only send SMS to verified numbers:

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Verified Caller IDs**
3. Click **Add a new Caller ID**
4. Enter your phone number (supports international numbers including `+91` for India)
5. Choose verification method (Call or SMS)
6. Enter the verification code you receive
7. Your number is now verified and can receive OTP messages

**Note**: You can verify multiple phone numbers (including Indian numbers) even with a US Twilio sender number.

## Testing with Indian Phone Numbers

**Good News**: You can send SMS to Indian phone numbers (`+91`) using a US Twilio number!

**Steps**:
1. Get a US Twilio number (free on trial)
2. Verify your Indian phone number in Twilio Console (see above)
3. Configure Twilio in Supabase with your US number
4. When testing, enter your Indian number: `+91 XXXXXXXXXX`
5. You'll receive the OTP SMS from the US number

**Important**: 
- The SMS will show a US sender (+1 number)
- This works for development and testing
- For production in India, consider upgrading Twilio or using Indian SMS providers

## Production Deployment

When you're ready to deploy:

1. **Upgrade Twilio Account** (optional but recommended):
   - Removes verified number restriction
   - Pay only for what you use (~$0.0075 per SMS)
   - No monthly fees on pay-as-you-go plan

2. **Update Supabase Auth Settings**:
   - Go to Authentication → Email Templates
   - Customize the SMS template for your brand
   - Set appropriate rate limits

3. **Environment Variables** (already configured):
   - Your Supabase credentials are in `.env`
   - No additional environment variables needed

## Troubleshooting

### "Failed to send OTP"

**Cause**: Twilio credentials not configured or incorrect

**Solution**:
- Double-check Account SID, Auth Token, and Phone Number in Supabase
- Ensure Phone provider is enabled in Supabase
- Verify the Twilio phone number has SMS capabilities

### "Could not send message to number"

**Cause**: Phone number not verified (trial account restriction)

**Solution**:
- Verify your phone number in Twilio Console (see above)
- OR upgrade to a paid Twilio account

### "Invalid verification code"

**Cause**: Code expired or incorrect

**Solution**:
- OTP codes expire after 60 seconds
- Click "Resend" to get a new code
- Make sure you're entering the exact 6-digit code

### SMS not received

**Cause**: Phone number format or network issues

**Solution**:
- Ensure phone number is in E.164 format: `+[country code][number]`
  - US example: `+15551234567`
  - India example: `+919876543210`
- Check your phone's SMS/message settings
- Some carriers may block automated messages
- Wait 30-60 seconds (some carriers have delays)

## Cost Estimation

### Free Tier (Trial)
- **Initial credit**: $15.50
- **Estimated SMS**: ~500 messages
- **Perfect for**: Testing and small user base

### Paid (Pay-as-you-go)
- **SMS cost**: $0.0075 per message (US)
- **Example**: 1,000 users signing up = ~$7.50
- **Monthly cost**: Only pay for actual usage
- **No subscription fees**

## Alternative: Free SMS Providers

If you want completely free SMS (with limitations):

### Option 1: Vonage (formerly Nexmo)
- **Free tier**: €2 credit
- **Setup**: Similar to Twilio
- **Integration**: Supabase supports Vonage
- **India availability**: Same restrictions as Twilio
- **Docs**: [Vonage SMS API](https://www.vonage.com/communications-apis/sms/)

### Option 2: MSG91 (Best for India)
- **Free tier**: Limited free SMS for India
- **Setup**: Requires MSG91 account
- **Integration**: Custom implementation required (not built into Supabase)
- **India availability**: ✅ Designed for Indian market
- **Docs**: [MSG91 API](https://msg91.com/)
- **Note**: Requires code changes to use MSG91 instead of Supabase phone auth

### Option 3: Kaleyra (India-focused)
- **Free tier**: Trial credits available
- **Setup**: KYC required
- **Integration**: Custom API implementation
- **India availability**: ✅ Full Indian compliance
- **Best for**: Production deployments in India

### Option 4: Test OTP (Development Only)
For development without SMS costs:

1. In Supabase Dashboard → Authentication → Settings
2. Scroll to **Security and Protection**
3. Find **Test OTP**
4. Add test phone numbers with fixed OTPs:
   ```
   +15555555555 = 123456
   +919876543210 = 654321
   ```
5. These numbers will always accept the specified OTP without sending SMS
6. **Perfect for development without any SMS provider setup**

## Security Best Practices

1. **Rate Limiting**: Supabase automatically limits OTP requests (60 seconds between requests)

2. **Phone Number Privacy**: Phone numbers are stored securely in Supabase Auth

3. **OTP Expiry**: Codes expire after 60 seconds

4. **Brute Force Protection**: Limited to 5 attempts per phone number

5. **Production Recommendations**:
   - Enable CAPTCHA for phone auth in Supabase settings
   - Monitor for unusual patterns in Twilio console
   - Set up billing alerts in Twilio

## Support

- **Supabase Docs**: https://supabase.com/docs/guides/auth/phone-login
- **Twilio Docs**: https://www.twilio.com/docs/sms
- **Supabase Discord**: https://discord.supabase.com/
- **Twilio Support**: https://support.twilio.com/

## Summary Checklist

- [ ] Create Twilio account
- [ ] Get Account SID, Auth Token, and Phone Number
- [ ] Configure Phone provider in Supabase
- [ ] Verify test phone numbers (if using trial)
- [ ] Test authentication flow
- [ ] (Optional) Customize SMS template
- [ ] (Optional) Upgrade Twilio for production

---

**That's it!** Your app now supports both Google and Phone authentication. Users can choose their preferred method on the landing page.
