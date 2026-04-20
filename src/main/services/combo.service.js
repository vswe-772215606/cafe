const comboRepo = require('../db/repositories/combo.repository');
const foodRepo = require('../db/repositories/food.repository');

function getAll() {
  return comboRepo.getAll();
}

function getById(id) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const combo = comboRepo.getByIdWithItems(id);

  if (!combo) {
    throw new Error('COMBO_NOT_FOUND');
  }

  return combo;
}

function create({ name, price, isActive, items }) {
  if (typeof name !== 'string') {
    throw new Error('INVALID_NAME');
  }

  name = name.trim();
  price = Number(price);

  if (name.length === 0) {
    throw new Error('INVALID_NAME');
  }

  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('INVALID_PRICE');
  }

  if (typeof isActive !== 'boolean') {
    throw new Error('INVALID_IS_ACTIVE');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('INVALID_ITEMS');
  }

  const existingCombo = comboRepo.getByName(name);

  if (existingCombo) {
    throw new Error('COMBO_NAME_EXISTS');
  }

  const seenFoodIds = new Set();

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw new Error('INVALID_ITEMS');
    }

    const foodId = Number(item.foodId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(foodId) || foodId <= 0) {
      throw new Error('INVALID_FOOD_ID');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('INVALID_QUANTITY');
    }

    if (seenFoodIds.has(foodId)) {
      throw new Error('INVALID_ITEMS');
    }

    const food = foodRepo.getById(foodId);

    if (!food) {
      throw new Error('FOOD_NOT_FOUND');
    }

    if (food.is_active !== 1) {
      throw new Error('FOOD_INACTIVE');
    }

    seenFoodIds.add(foodId);
    item.foodId = foodId;
    item.quantity = quantity;
  }

  return comboRepo.create({ name, price, isActive, items });
}

function update(id, { name, price, isActive, items }) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const existingCombo = comboRepo.getById(id);

  if (!existingCombo) {
    throw new Error('COMBO_NOT_FOUND');
  }

  if (typeof name !== 'string') {
    throw new Error('INVALID_NAME');
  }

  name = name.trim();
  price = Number(price);

  if (name.length === 0) {
    throw new Error('INVALID_NAME');
  }

  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('INVALID_PRICE');
  }

  if (typeof isActive !== 'boolean') {
    throw new Error('INVALID_IS_ACTIVE');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('INVALID_ITEMS');
  }

  const comboWithSameName = comboRepo.getByName(name);

  if (comboWithSameName && comboWithSameName.id !== id) {
    throw new Error('COMBO_NAME_EXISTS');
  }

  const seenFoodIds = new Set();

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw new Error('INVALID_ITEMS');
    }

    const foodId = Number(item.foodId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(foodId) || foodId <= 0) {
      throw new Error('INVALID_FOOD_ID');
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('INVALID_QUANTITY');
    }

    if (seenFoodIds.has(foodId)) {
      throw new Error('INVALID_ITEMS');
    }

    const food = foodRepo.getById(foodId);

    if (!food) {
      throw new Error('FOOD_NOT_FOUND');
    }

    if (food.is_active !== 1) {
      throw new Error('FOOD_INACTIVE');
    }

    seenFoodIds.add(foodId);
    item.foodId = foodId;
    item.quantity = quantity;
  }

  return comboRepo.update(id, { name, price, isActive, items });
}

function setActive(id, isActive) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const combo = comboRepo.getById(id);

  if (!combo) {
    throw new Error('COMBO_NOT_FOUND');
  }

  if (typeof isActive !== 'boolean') {
    throw new Error('INVALID_IS_ACTIVE');
  }

  return comboRepo.setActive(id, isActive);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  setActive,
};
