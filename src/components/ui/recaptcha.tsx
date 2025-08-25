export function ReCaptcha({ onVerify, onExpire, onError }: ReCaptchaProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn('reCAPTCHA site key not found. Please add NEXT_PUBLIC_RECAPTCHA_SITE_KEY to your environment variables.');
    return (
      <div className="text-sm text-muted-foreground">
        reCAPTCHA configuration required
      </div>
    );
  }

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={siteKey}
      onChange={onVerify}
      onExpired={onExpire}
      onError={onError}
      size="normal"
    />
  );
}