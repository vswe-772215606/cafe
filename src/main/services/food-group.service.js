const repo = require('../db/repositories/food-group.repository');

function getAll() {
  return repo.getAll();
}

function create({ name }) {
  if (typeof name !== 'string') {
    throw new Error('INVALID_NAME');
  }

  name = name.trim();

  if (name.length === 0) {
    throw new Error('INVALID_NAME');
  }

  return repo.create({ name });
}

function update(id, { name }) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  if (typeof name !== 'string') {
    throw new Error('INVALID_NAME');
  }

  name = name.trim();

  if (name.length === 0) {
    throw new Error('INVALID_NAME');
  }

  const existingGroup = repo.getById(id);

  if (!existingGroup) {
    throw new Error('FOOD_GROUP_NOT_FOUND');
  }

  return repo.update(id, { name });
}

function deleteById(id) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const existingGroup = repo.getById(id);

  if (!existingGroup) {
    throw new Error('FOOD_GROUP_NOT_FOUND');
  }

  try {
    const deleted = repo.deleteById(id);

    if (!deleted) {
      throw new Error('FOOD_GROUP_DELETE_FAILED');
    }

    return true;
  } catch (error) {
    throw new Error('FOOD_GROUP_DELETE_FAILED');
  }
}

module.exports = {
  getAll,
  create,
  update,
  deleteById,
};
