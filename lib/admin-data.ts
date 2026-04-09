var SHOP_SELECT = 'id, name, slug, plan, addons, phone, wave_number, orange_number, mtn_number, owner_id, delivery_phone, onboarding_completed'
var ORDER_SELECT = 'id, order_number, customer_name, customer_phone, customer_address, delivery_mode, total, payment_mode, payment_status, status, created_at'
// Ne pas inclure de colonnes non garanties (ex: `category`) : si la colonne n'existe pas,
// PostgREST renvoie une erreur et `prodRes.data` devient vide => "0 produit".
var PRODUCT_SELECT = 'id, name, price, description, image_url, image_url_2, image_url_3, stock_quantity, stock_alert, stock_buffer, is_active, has_variants, category, product_images (id, image_url, position)'

export { SHOP_SELECT, ORDER_SELECT, PRODUCT_SELECT }
