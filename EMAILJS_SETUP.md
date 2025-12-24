# EmailJS Setup Guide for fyrShare

## Overview
This guide will help you set up EmailJS to send automated email invitations from fyrShare. EmailJS is **100% FREE** for up to 200 emails/month.

---

## Step 1: Install EmailJS Package

Run this command in your project directory:

```bash
npm install @emailjs/browser
```

---

## Step 2: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click **"Sign Up Free"**
3. Sign up with your email or Google account
4. Verify your email address

---

## Step 3: Add Email Service

### ⚠️ IMPORTANT: Gmail Authentication Issue

Gmail has strict OAuth scopes that often cause "insufficient authentication scopes" errors. **We recommend using Outlook/Hotmail instead** (it's easier and more reliable).

### Option A: Using Outlook/Hotmail (RECOMMENDED ✅)

1. After logging in, go to **"Email Services"** in the left sidebar
2. Click **"Add New Service"**
3. Choose **"Outlook"** (works with any @outlook.com, @hotmail.com, @live.com email)
4. Click **"Connect Account"**
5. Sign in with your Microsoft account
6. Give your service a name (e.g., "fyrShare Invites")
7. **Copy the Service ID** (e.g., `service_abc1234`) - you'll need this!

### Option B: Using Gmail (May require extra steps)

1. After logging in, go to **"Email Services"** in the left sidebar
2. Click **"Add New Service"**
3. Choose **"Gmail"**
4. Click **"Connect Account"**
5. Follow the Gmail OAuth flow
6. ⚠️ If you get **"insufficient authentication scopes"** error:
   - Go back to Email Services
   - Click the **trash icon** to delete the Gmail service
   - Create a new service again and try re-authenticating
   - OR use **Option A (Outlook)** instead
7. Give your service a name (e.g., "fyrShare Invites")
8. **Copy the Service ID** (e.g., `service_abc1234`) - you'll need this!

---

## Step 4: Create Email Template

1. Go to **"Email Templates"** in the left sidebar
2. Click **"Create New Template"**
3. **CRITICAL:** In the template settings, set the **"To Email"** field to: `{{to_email}}`
   - This is often missed! Without this, emails won't be sent to the recipient
4. Use this template structure:

**Subject:**
```
{{from_name}} invited you to join {{app_name}}!
```

**Content:**
```
Hi {{to_name}},

{{from_name}} ({{from_email}}) has invited you to join {{app_name}} - a simple app for splitting expenses and tracking shared costs with friends!

{{message}}

Click here to join:
{{invite_link}}

Split bills, track expenses, and settle up with friends - all in one place!

Best regards,
The fyrShare Team
```

5. **⚠️ IMPORTANT - Set the "To Email" field:**
   - Scroll down to the **"To Email"** input field in the template editor
   - Enter: `{{to_email}}`
   - This tells EmailJS where to send the email

6. Click **"Save"**
7. **Copy the Template ID** (e.g., `template_xyz5678`) - you'll need this!

---

## Step 5: Get Your Public Key

1. Go to **"Account"** in the left sidebar
2. Click on **"General"** tab
3. Find **"Public Key"** section
4. **Copy your Public Key** (e.g., `ABCdefGHI123xyz`) - you'll need this!

---

## Step 6: Add Environment Variables

1. In your project root, create a file named `.env` (if it doesn't exist)

2. Add your EmailJS credentials:

```bash
VITE_EMAILJS_SERVICE_ID=service_abc1234
VITE_EMAILJS_TEMPLATE_ID=template_xyz5678
VITE_EMAILJS_PUBLIC_KEY=ABCdefGHI123xyz
```

Replace with your actual values:
- `service_abc1234` - Your Service ID from Step 3
- `template_xyz5678` - Your Template ID from Step 4
- `ABCdefGHI123xyz` - Your Public Key from Step 5

3. **IMPORTANT:** Make sure `.env` is in your `.gitignore` file (it should be by default)

4. Restart your dev server after adding environment variables:
```bash
npm run dev
```

---

## Step 7: Test It Out!

1. Run your app: `npm run dev`
2. Go to the Friends tab
3. Click **"Invite Friends"**
4. Enter an email address in the "Send Email Invitation" section
5. Click **"Send Invitation"**
6. Check the recipient's inbox!

---

## Template Variables Reference

The email template uses these variables:

- `{{to_email}}` - Recipient's email address
- `{{to_name}}` - Recipient's name (extracted from email)
- `{{from_name}}` - Your name (from logged-in user)
- `{{from_email}}` - Your email (from logged-in user)
- `{{invite_link}}` - The invite link
- `{{app_name}}` - "fyrShare"
- `{{message}}` - Custom message

---

## Troubleshooting

### ❌ Error: "Request had insufficient authentication scopes" (Gmail)

This is a common Gmail OAuth issue. **Solutions:**

1. **EASIEST FIX:** Use Outlook/Hotmail instead of Gmail
   - Delete your Gmail service in EmailJS dashboard
   - Add a new service and choose "Outlook"
   - Use any @outlook.com, @hotmail.com, or @live.com email
   - This works perfectly and has no scope issues

2. **If you must use Gmail:**
   - Go to EmailJS Dashboard → Email Services
   - Delete the Gmail service
   - Click "Add New Service" → Gmail
   - During authentication, make sure you:
     - Grant ALL requested permissions
     - Don't skip any permission screens
     - Use a personal Gmail (not workspace/organization)
   - Try authenticating 2-3 times if needed

3. **Alternative: Use SMTP** (Advanced)
   - In EmailJS, add a "Custom" SMTP service
   - Use Gmail SMTP settings:
     - Host: smtp.gmail.com
     - Port: 465 or 587
     - Enable "App Password" in your Google Account
     - Use the app password instead of your regular password

### Emails not sending?
1. Check browser console for errors
2. Verify all 3 credentials are correct (Service ID, Template ID, Public Key)
3. Make sure you're not exceeding the 200 emails/month limit
4. Check EmailJS dashboard for failed emails

### Gmail blocking emails?
1. Go to EmailJS Email Services
2. Re-authenticate your Gmail account
3. Check Gmail "Less secure app access" settings

### Emails going to spam?
- This is normal for the free tier
- Recipients should check their spam/junk folder
- EmailJS free tier doesn't support custom domains

---

## Free Tier Limits

- ✅ **200 emails/month** - FREE
- ✅ **2 email templates** - FREE
- ✅ **No credit card required**
- ✅ **Unlimited email services**

Need more? Upgrade to paid plans starting at $7/month for 1000 emails.

---

## Alternative: Using Your Own Backend

If you prefer to use your own backend, you can replace the EmailJS code with your own API endpoint. The current implementation sends:

```javascript
{
  to_email: "recipient@email.com",
  from_name: "Your Name",
  from_email: "your@email.com",
  invite_link: "https://yourapp.com/invite/...",
  // ... other fields
}
```

---

## Support

- EmailJS Documentation: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/)
- EmailJS Dashboard: [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)

---

**That's it! You're all set to send automated email invitations! 🎉**
