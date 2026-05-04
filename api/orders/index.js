// ============================================================================
// /api/orders
//   GET  ?restaurantId=xxx → merchant: list orders of their restaurant
//   POST                   → public: create new order (no auth required)
// ============================================================================
import { supabase } from '../../lib/supabase.js';
import { requireMerchant } from '../../lib/auth.js';
import { handleCors, getBody } from '../../lib/cors.js';

const shortId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const MONEY_EPSILON = 0.01;
const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const isFiniteNumber = (value) => Number.isFinite(Number(value));

function validateChoiceStock(choice, qty, productName) {
  if (choice.stock === null || choice.stock === undefined) return;
  if (!Number.isInteger(choice.stock) || choice.stock < qty) {
    throw new Error(`Stock insuffisant pour ${productName} (${choice.name})`);
  }
}

function validateComposableItem(product, item, qty) {
  const groups = Array.isArray(product.options) ? product.options : [];
  const selectedIds = Array.from(new Set(Array.isArray(item.choiceIds) ? item.choiceIds.filter(Boolean) : []));
  const selectedIdSet = new Set(selectedIds);
  const selectedChoiceIds = [];
  const detailParts = [];
  let unitPrice = roundMoney(product.base_price || 0);

  for (const group of groups) {
    const choices = Array.isArray(group.choices) ? group.choices : [];
    const picked = choices.filter((choice) => selectedIdSet.has(choice.id));

    if (group.type === 'single') {
      if (picked.length > 1) {
        throw new Error(`Un seul choix est autorisé pour ${group.groupName}`);
      }
      if (group.required && picked.length !== 1) {
        throw new Error(`Le groupe ${group.groupName} est requis`);
      }
    } else {
      if (group.required && picked.length === 0) {
        throw new Error(`Le groupe ${group.groupName} est requis`);
      }
      if (group.maxSelect && picked.length > Number(group.maxSelect)) {
        throw new Error(`Trop de choix pour ${group.groupName}`);
      }
    }

    if (!picked.length) continue;

    const pickedNames = [];
    for (const choice of picked) {
      validateChoiceStock(choice, qty, product.name);
      unitPrice = roundMoney(unitPrice + Number(choice.priceDelta || 0));
      selectedChoiceIds.push(choice.id);
      pickedNames.push(choice.name);
    }

    detailParts.push(group.type === 'single' ? pickedNames[0] : pickedNames.join(', '));
  }

  return {
    unitPrice,
    choiceIds: selectedChoiceIds,
    details: detailParts.join(' · ') || null,
  };
}

async function buildValidatedOrderPayload(restaurantId, items, submittedTotal) {
  const productIds = Array.from(new Set(items.map((item) => item.productId).filter(Boolean)));
  if (!productIds.length) {
    throw new Error('Order items are invalid');
  }

  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('restaurant_id', restaurantId)
    .eq('active', true);

  if (error) {
    console.error('[orders POST products]', error);
    throw new Error('Failed to validate products');
  }

  const productsById = new Map((dbProducts || []).map((product) => [product.id, product]));
  const normalizedItems = [];
  const stockUpdates = [];
  let computedTotal = 0;

  for (const item of items) {
    const qty = parseInt(item.qty, 10);
    if (!item?.productId || !Number.isInteger(qty) || qty < 1) {
      throw new Error('Order items are invalid');
    }

    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`Produit introuvable pour la commande`);
    }

    if (product.type === 'unit') {
      const currentStock = product.stock === null || product.stock === undefined ? null : parseInt(product.stock, 10);
      if (currentStock !== null && (!Number.isInteger(currentStock) || currentStock < qty)) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      const unitPrice = roundMoney(product.price);
      normalizedItems.push({
        productId: product.id,
        name: product.name,
        qty,
        totalPrice: unitPrice,
        choiceIds: [],
        details: null,
      });
      computedTotal = roundMoney(computedTotal + unitPrice * qty);
      stockUpdates.push({ type: 'unit', productId: product.id, nextStock: currentStock === null ? null : Math.max(0, currentStock - qty) });
      continue;
    }

    const normalizedComposable = validateComposableItem(product, item, qty);
    normalizedItems.push({
      productId: product.id,
      name: product.name,
      qty,
      totalPrice: normalizedComposable.unitPrice,
      choiceIds: normalizedComposable.choiceIds,
      details: normalizedComposable.details,
    });
    computedTotal = roundMoney(computedTotal + normalizedComposable.unitPrice * qty);
    stockUpdates.push({
      type: 'composable',
      productId: product.id,
      qty,
      choiceIds: normalizedComposable.choiceIds,
    });
  }

  const clientTotal = roundMoney(submittedTotal);
  if (!isFiniteNumber(submittedTotal) || Math.abs(clientTotal - computedTotal) > MONEY_EPSILON) {
    throw new Error('Order total mismatch');
  }

  return { normalizedItems, computedTotal, stockUpdates, productsById };
}

async function applyStockUpdates(stockUpdates, productsById) {
  for (const update of stockUpdates) {
    if (update.type === 'unit') {
      if (update.nextStock === null) continue;
      const { error } = await supabase
        .from('products')
        .update({ stock: update.nextStock })
        .eq('id', update.productId);
      if (error) throw error;
      const current = productsById.get(update.productId);
      if (current) current.stock = update.nextStock;
      continue;
    }

    const current = productsById.get(update.productId);
    if (!current || !Array.isArray(current.options) || !update.choiceIds.length) continue;

    const choiceSet = new Set(update.choiceIds);
    const nextOptions = current.options.map((group) => ({
      ...group,
      choices: Array.isArray(group.choices)
        ? group.choices.map((choice) => {
            if (!choiceSet.has(choice.id) || choice.stock === null || choice.stock === undefined) return choice;
            return {
              ...choice,
              stock: Math.max(0, Number(choice.stock) - update.qty),
            };
          })
        : [],
    }));

    const { error } = await supabase
      .from('products')
      .update({ options: nextOptions })
      .eq('id', update.productId);
    if (error) throw error;
    current.options = nextOptions;
  }
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ─── GET (merchant only, restricted to own restaurant) ───────────────
  if (req.method === 'GET') {
    const user = requireMerchant(req, res);
    if (!user) return;
    if (!user.restaurantId) return res.status(400).json({ error: 'No restaurant linked' });

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', user.restaurantId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('[orders GET]', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    return res.status(200).json({ orders: data || [] });
  }

  // ─── POST (public, no auth — clients pass orders without account) ────
  if (req.method === 'POST') {
    const body = getBody(req);
    const {
      restaurantId, items, total, customerName, customerPhone, customerEmail,
      pickupTime, paymentMethod, remarks, source = 'platform',
    } = body;

    if (!restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate restaurant exists & open
    const { data: rest } = await supabase
      .from('restaurants')
      .select('id, open')
      .eq('id', restaurantId)
      .maybeSingle();
    if (!rest) return res.status(404).json({ error: 'Restaurant not found' });
    if (!rest.open) return res.status(400).json({ error: 'Restaurant is closed' });

    let validated;
    try {
      validated = await buildValidatedOrderPayload(restaurantId, items, total);
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Invalid order' });
    }

    // Insert order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        short_id: shortId(),
        restaurant_id: restaurantId,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        items: validated.normalizedItems,
        total: validated.computedTotal,
        pickup_time: pickupTime || null,
        payment_method: paymentMethod || null,
        remarks: remarks || null,
        source,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[orders POST]', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Best-effort stock decrement (fail silently if it errors)
    try {
      await applyStockUpdates(validated.stockUpdates, validated.productsById);
    } catch (e) {
      console.warn('[orders POST stock]', e);
    }

    return res.status(201).json({ order: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
