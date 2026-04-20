const foodRepo = require('../db/repositories/food.repository');
const foodGroupRepo = require('../db/repositories/food-group.repository');

function getAll() {
  return foodRepo.getAll();
}

function getById(id) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const food = foodRepo.getById(id);

  if (!food) {
    throw new Error('FOOD_NOT_FOUND');
  }

  return food;
}

function getByFoodGroupId(foodGroupId) {
  foodGroupId = Number(foodGroupId);

  if (!Number.isInteger(foodGroupId) || foodGroupId <= 0) {
    throw new Error('INVALID_FOOD_GROUP_ID');
  }

  const foodGroup = foodGroupRepo.getById(foodGroupId);

  if (!foodGroup) {
    throw new Error('FOOD_GROUP_NOT_FOUND');
  }

  return foodRepo.getByFoodGroupId(foodGroupId);
}

function create({ name, price, foodGroupId }) {
  if (typeof name !== 'string') {
    throw new Error('INVALID_NAME');
  }

  name = name.trim();
  price = Number(price);
  foodGroupId = Number(foodGroupId);

  if (name.length === 0) {
    throw new Error('INVALID_NAME');
  }

  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('INVALID_PRICE');
  }

  if (!Number.isInteger(foodGroupId) || foodGroupId <= 0) {
    throw new Error('INVALID_FOOD_GROUP_ID');
  }

  const foodGroup = foodGroupRepo.getById(foodGroupId);

  if (!foodGroup) {
    throw new Error('FOOD_GROUP_NOT_FOUND');
  }

  return foodRepo.create({ name, price, foodGroupId });
}

function update(id, { name, price, foodGroupId }) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const food = foodRepo.getById(id);

  if (!food) {
    throw new Error('FOOD_NOT_FOUND');
  }

  if (typeof name !== 'string') {
    throw new Error('INVALID_NAME');
  }

  name = name.trim();
  price = Number(price);
  foodGroupId = Number(foodGroupId);

  if (name.length === 0) {
    throw new Error('INVALID_NAME');
  }

  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('INVALID_PRICE');
  }

  if (!Number.isInteger(foodGroupId) || foodGroupId <= 0) {
    throw new Error('INVALID_FOOD_GROUP_ID');
  }

  const foodGroup = foodGroupRepo.getById(foodGroupId);

  if (!foodGroup) {
    throw new Error('FOOD_GROUP_NOT_FOUND');
  }

  return foodRepo.update(id, { name, price, foodGroupId });
}

function setActive(id, isActive) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const food = foodRepo.getById(id);

  if (!food) {
    throw new Error('FOOD_NOT_FOUND');
  }

  if (typeof isActive !== 'boolean') {
    throw new Error('INVALID_IS_ACTIVE');
  }

  return foodRepo.setActive(id, isActive);
}

module.exports = {
  getAll,
  getById,
  getByFoodGroupId,
  create,
  update,
  setActive,
};
