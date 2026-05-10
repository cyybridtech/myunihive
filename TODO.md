# TODO - UniHive Email OTP + Booking Confirmation Fix

## Step 1: Verify current email flow wiring
- [x] Identify OTP generation endpoint: `backend/api/requestOtp.js`
- [x] Identify email sender module: `backend/api/sendEmail.js`
- [x] Identify booking confirmation sender: `backend/api/verifyPayment.js` (uses `sendBookingEmail`)

## Step 2: Fix OTP email not being delivered
- [x] Make `/api/request-otp` return an error if SMTP/email credentials are missing (by failing when sendOtpEmail returns false)
- [x] Make OTP email sending awaited
- [ ] Add explicit logs for `EMAIL_USER`, `EMAIL_PASS` presence and target recipient

## Step 3: Fix welcome + booking confirmation not being delivered
- [ ] Ensure welcome email failures are surfaced in logs with enough context
- [ ] Ensure `details.user_email` from DB is always populated (defensive checks)
- [ ] Make booking confirmation handler fail loudly (or return status) if email cannot be sent

## Step 4: Testing
- [ ] Run `/api/test-email` and confirm SMTP sends successfully
- [ ] Call `/api/request-otp` and confirm email arrives
- [ ] Complete registration and booking/payment flow to confirm welcome + confirmation emails

