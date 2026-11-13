/**
 * Gestion de la Tarification par Lot (FIFO) vs Prix Moyen Pondéré
 * NovaMag POS
 */

/**
 * Récupère la liste normalisée des lots d'un produit.
 * Si le produit ne dispose pas encore de lots explicites, son stock initial est converti en Lot #1.
 */
export const getProductBatches = (product) => {
  if (Array.isArray(product?.batches) && product.batches.length > 0) {
    return product.batches;
  }

  const stock = typeof product?.stock === 'number' ? product.stock : 0;
  const sellPrice = typeof product?.price === 'number' ? product.price : 0;
  const buyPrice = typeof product?.buyPrice === 'number'
    ? product.buyPrice
    : typeof product?.costPrice === 'number'
    ? product.costPrice
    : Math.round(sellPrice * 0.75);

  return [
    {
      id: `batch-${product?.id || 1}-init`,
      batchNumber: 'LOT-INITIAL',
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      quantity: stock,
      barcode: product?.barcode || '',
      receivedAt: '2026-01-01'
    }
  ];
};

/**
 * Calcule le prix moyen pondéré par la quantité sur tous les lots disponibles (stock > 0).
 */
export const computeWeightedAveragePrice = (batches, defaultPrice = 0) => {
  const activeBatches = batches.filter((b) => Number(b.quantity) > 0);
  if (activeBatches.length === 0) return defaultPrice;

  const totalQty = activeBatches.reduce((acc, b) => acc + Number(b.quantity), 0);
  const totalVal = activeBatches.reduce((acc, b) => acc + (Number(b.quantity) * Number(b.sellPrice || defaultPrice)), 0);

  return totalQty > 0 ? Math.round((totalVal / totalQty) * 100) / 100 : defaultPrice;
};

/**
 * Détermine le prix de vente unitaire d'un article selon les paramètres système :
 * 
 * 1. Si un code-barres spécifique au lot a été scanné -> Prix de ce lot
 * 2. Si "averagePricing" est coché -> Moyenne pondérée sur tous les lots disponibles
 * 3. Par défaut ("averagePricing" non coché) -> Tarification par lot (FIFO) :
 *    Prend le lot le plus ancien encore disponible. Dès qu'un lot est épuisé par les
 *    articles déjà présents dans le panier, passe automatiquement au lot suivant avec son nouveau tarif !
 */
export const calculateProductSellingPrice = (
  product,
  settings = {},
  scannedBarcode = null,
  alreadyInCartQty = 0
) => {
  const isAveragePricing = Boolean(settings?.averagePricing);
  const batches = getProductBatches(product);

  // ── Cas 1 : Scan d'un code-barres spécifique à un lot ──
  if (scannedBarcode) {
    const matchedBatch = batches.find((b) => b.barcode && b.barcode === scannedBarcode.trim());
    if (matchedBatch && typeof matchedBatch.sellPrice === 'number') {
      return {
        price: matchedBatch.sellPrice,
        costPrice: matchedBatch.buyPrice || 0,
        batchId: matchedBatch.id,
        batchNumber: matchedBatch.batchNumber,
        isSpecificLotScan: true
      };
    }
  }

  const activeBatches = batches.filter((b) => Number(b.quantity) > 0);

  // Si tous les lots sont épuisés
  if (activeBatches.length === 0) {
    const lastBatch = batches[batches.length - 1];
    return {
      price: lastBatch?.sellPrice || product.price || 0,
      costPrice: lastBatch?.buyPrice || 0,
      batchId: lastBatch?.id,
      batchNumber: lastBatch?.batchNumber || 'ÉPUISÉ',
      isOutOfStock: true
    };
  }

  // ── Cas 2 : Tarification au Prix Moyen (au lieu de lot par lot) ──
  if (isAveragePricing) {
    const avgPrice = computeWeightedAveragePrice(activeBatches, product.price);
    return {
      price: avgPrice,
      costPrice: activeBatches[0]?.buyPrice || 0,
      batchNumber: 'PRIX MOYEN',
      isAveragePricing: true
    };
  }

  // ── Cas 3 : PAR DÉFAUT -> Tarification par Lot (FIFO) ──
  // On simule la consommation des lots par les unités déjà présentes dans le panier
  let remainingSkip = Math.max(0, alreadyInCartQty);

  for (const batch of activeBatches) {
    const batchQty = Number(batch.quantity);
    if (batchQty > remainingSkip) {
      return {
        price: Number(batch.sellPrice || product.price),
        costPrice: Number(batch.buyPrice || 0),
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        remainingInBatch: batchQty - remainingSkip
      };
    }
    remainingSkip -= batchQty;
  }

  // Si la quantité totale du panier dépasse tous les lots en stock (stock négatif autorisé)
  const newestBatch = activeBatches[activeBatches.length - 1];
  return {
    price: Number(newestBatch?.sellPrice || product.price),
    costPrice: Number(newestBatch?.buyPrice || 0),
    batchId: newestBatch?.id,
    batchNumber: newestBatch?.batchNumber,
    isNegativeStock: true
  };
};

/**
 * Déduit une quantité vendue des lots d'un produit en respectant le principe FIFO.
 * Si un lot précis a été ciblé par un scan direct, déduit en priorité de ce lot.
 */
export const deductQuantityFromBatches = (batches, qtyToDeduct, targetBatchId = null) => {
  let remaining = Number(qtyToDeduct);
  if (remaining <= 0) return batches;

  let updated = batches.map((b) => ({ ...b }));

  // Si un lot spécifique était ciblé
  if (targetBatchId) {
    const targetIdx = updated.findIndex((b) => b.id === targetBatchId);
    if (targetIdx >= 0) {
      const b = updated[targetIdx];
      const deductFromTarget = Math.min(b.quantity, remaining);
      b.quantity -= deductFromTarget;
      remaining -= deductFromTarget;
    }
  }

  // Déduction FIFO des lots restants
  if (remaining > 0) {
    for (let i = 0; i < updated.length; i++) {
      if (remaining <= 0) break;
      if (updated[i].quantity > 0) {
        if (updated[i].quantity <= remaining) {
          remaining -= updated[i].quantity;
          updated[i].quantity = 0;
        } else {
          updated[i].quantity -= remaining;
          remaining = 0;
        }
      }
    }
  }

  // Si tout est épuisé et qu'il reste de la quantité manquante (vente en stock négatif)
  if (remaining > 0 && updated.length > 0) {
    const lastIdx = updated.length - 1;
    updated[lastIdx].quantity -= remaining;
  }

  return updated;
};
