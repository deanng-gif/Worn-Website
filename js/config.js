// =====================================================================
// Worn: connection settings
//
// supabaseUrl / supabaseKey: your Supabase project's URL and public
// "anon" key. These are SAFE to put in a public website; your data is
// protected by row-level security. NEVER put a service_role or secret
// key here.
//
// paymentLinks / billingPortal: Stripe-hosted pages for checkout and for
// subscribers to manage or cancel their plan.
// =====================================================================
window.WORN_CONFIG = {
  supabaseUrl: 'https://ejyxqtxqxwlildlkgxcb.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXhxdHhxeHdsaWxkbGtneGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTg3NjgsImV4cCI6MjEwOTQ3NDc2OH0.7k_iH-5KtYARxjHppFCdiIEmgtmfl9QIhRlwM9nI6xw',

  // Stripe SANDBOX links (test mode: use card 4242 4242 4242 4242).
  // When you go live, replace these with the live-mode links.
  paymentLinks: {
    monthly: 'https://buy.stripe.com/test_00w9AS7dmcnp9kdd0Ye7m00',
    annual: 'https://buy.stripe.com/test_8x24gy69i9bd681e52e7m01'
  },
  billingPortal: 'https://billing.stripe.com/p/login/test_00w9AS7dmcnp9kdd0Ye7m00'
};
