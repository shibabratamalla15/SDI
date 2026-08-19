// Fill these in with your own Supabase project's API URL and anon (public) key.
// Find them in: Supabase Dashboard → your project → Project Settings → API.
//
// The "anon" key is safe to put in this public file — it is designed to be
// public, and is restricted by the Row Level Security policies you'll set up
// in schema.sql. Do NOT put your "service_role" key here; that one must stay secret.

const SUPABASE_URL = "https://YOUR-PROJECT-ref.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
async function saveOrderToSupabase(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        order_id: orderData.id,
        customer_name: orderData.customerName,
        phone_number: orderData.phone,
        area: orderData.area,
        landmark: orderData.landmark,
        items: orderData.items,
        total_amount: orderData.total
      }
    ]);

  if (error) console.error('Order save error:', error);
      }
async function fetchOrdersForOwner() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  // Render orders in Owner UI
  renderOwnerOrdersList(orders);
}
