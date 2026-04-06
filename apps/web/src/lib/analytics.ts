/**
 * GA4 event tracking — conditional on cookie consent.
 */

type GtagFn = (...args: [string, ...unknown[]]) => void

declare global {
  interface Window {
    gtag?: GtagFn
  }
}

function hasConsent(): boolean {
  try {
    return localStorage.getItem('complens_cookie_consent') === 'granted'
  } catch {
    return false
  }
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined' || !hasConsent() || !window.gtag) return
  window.gtag('event', name, params)
}

export function trackSignup() {
  trackEvent('sign_up', { method: 'email' })
}

export function trackDatasetUpload() {
  trackEvent('dataset_upload')
}

export function trackReportGenerated(format: 'pdf' | 'ppt' = 'pdf') {
  trackEvent('report_generated', { format })
}

export function trackCheckoutStarted() {
  trackEvent('begin_checkout', { currency: 'EUR', value: 5990 })
}

export function trackPaymentComplete() {
  trackEvent('purchase', { currency: 'EUR', value: 5990 })
}
