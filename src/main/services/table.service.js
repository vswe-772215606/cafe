const repo = require('../db/repositories/table.repository');

function getAll() {
  return repo.getAll();
}

function getById(id) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const table = repo.getById(id);

  if (!table) {
    throw new Error('TABLE_NOT_FOUND');
  }

  return table;
}

function create({ number }) {
  number = Number(number);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('INVALID_TABLE_NUMBER');
  }

  const existingTable = repo.getByNumber(number);

  if (existingTable) {
    throw new Error('TABLE_NUMBER_EXISTS');
  }

  return repo.create({ number });
}

function update(id, { number }) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const existingTable = repo.getById(id);

  if (!existingTable) {
    throw new Error('TABLE_NOT_FOUND');
  }

  number = Number(number);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('INVALID_TABLE_NUMBER');
  }

  const tableWithSameNumber = repo.getByNumber(number);

  if (tableWithSameNumber && tableWithSameNumber.id !== id) {
    throw new Error('TABLE_NUMBER_EXISTS');
  }

  return repo.update(id, { number });
}

function deleteById(id) {
  id = Number(id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('INVALID_ID');
  }

  const existingTable = repo.getById(id);

  if (!existingTable) {
    throw new Error('TABLE_NOT_FOUND');
  }

  try {
    const deleted = repo.deleteById(id);

    if (!deleted) {
      throw new Error('TABLE_DELETE_FAILED');
    }

    return true;
  } catch (error) {
    throw new Error('TABLE_DELETE_FAILED');
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteById,
};
