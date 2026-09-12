# 🎬 CineFlix Auth & Redirect Gateway Server

Node.js + Express + Vercel server for handling **Password Reset / Change** and **Email Confirmation** flows for the **CineFlix OTT Android App**.

---

## 🌟 Features

- 🔐 **Password Reset Page (`/reset-password`)**:
  - Ultra-modern OTT dark glassmorphism aesthetic matching CineFlix.
  - Password visibility toggle & real-time strength meter.
  - Updates password directly via Supabase Auth API.
  - Automatic 3-second redirect countdown + **"Open CineFlix App"** deep link button (`cineflix://auth/callback`).

- ✉️ **Email Confirmation Page (`/confirm`)**:
  - Automatically verifies OTP token hash or session token.
  - Shows success checkmark and launches CineFlix App directly.
  - Avoids opening raw localhost or blank browser screens.

- 🚀 **App Deep Linking**:
  - Integrates seamlessly with Android `cineflix://auth/callback`.

---

## ⚡ Deploy to Vercel (Recommended)

1. Push this folder to your GitHub repo.
2. Open [Vercel Dashboard](https://vercel.com/new) -> Import repository.
3. In **Environment Variables**, add:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-supabase-anon-key`
   - `APP_SCHEME` = `cineflix`
   - `APP_PACKAGE_NAME` = `com.cineflix.ott`
4. Click **Deploy**!

---

## ⚙️ Supabase Dashboard Configuration

In your [Supabase Dashboard](https://supabase.com/dashboard) -> **Authentication** -> **URL Configuration**:

1. **Site URL**:
   Set this to your Vercel domain:
   ```
   https://your-project.vercel.app
   ```

2. **Redirect URLs (Allowlist)**:
   Add these URLs in the Redirect URLs section:
   ```
   https://your-project.vercel.app/confirm
   https://your-project.vercel.app/reset-password
   cineflix://auth/callback
   http://localhost:3000/confirm
   http://localhost:3000/reset-password
   ```

3. **Email Templates**:
   - In **Authentication** -> **Email Templates** -> **Confirm signup**:
     ```html
     <h2>Confirm your CineFlix account</h2>
     <p>Click below to verify your email and start streaming:</p>
     <p><a href="{{ .SiteURL }}/confirm?token_hash={{ .TokenHash }}&type=email">Verify Email</a></p>
     ```
   - In **Authentication** -> **Email Templates** -> **Reset Password**:
     ```html
     <h2>Reset your CineFlix Password</h2>
     <p>Click below to choose a new password:</p>
     <p><a href="{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a></p>
     ```

Developed by **Shariq Babu** for CineFlix OTT.