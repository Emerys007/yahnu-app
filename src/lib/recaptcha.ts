
export async function verifyRecaptcha(token: string, action?: string): Promise<boolean> {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('RECAPTCHA_SECRET_KEY not configured')
    return true // Allow in development
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    })

    const data = await response.json()
    
    if (data.success && data.score && data.score >= 0.5) {
      if (action && data.action !== action) {
        return false
      }
      return true
    }
    
    return false
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return false
  }
}
