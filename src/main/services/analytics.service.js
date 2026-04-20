const repo = require('../db/repositories/analytics.repository');

function validateDateRange({ fromDate, toDate }) {
  if (typeof fromDate !== 'string' || fromDate.trim().length === 0 || Number.isNaN(Date.parse(fromDate))) {
    throw new Error('INVALID_FROM_DATE');
  }

  if (typeof toDate !== 'string' || toDate.trim().length === 0 || Number.isNaN(Date.parse(toDate))) {
    throw new Error('INVALID_TO_DATE');
  }

  if (Date.parse(fromDate) > Date.parse(toDate)) {
    throw new Error('INVALID_DATE_RANGE');
  }
}

function validateLimit(limit) {
  limit = Number(limit);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('INVALID_LIMIT');
  }

  return limit;
}

function getSummary({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  return repo.getSummary(fromDate, toDate);
}

function getTopItems({ fromDate, toDate, limit }) {
  validateDateRange({ fromDate, toDate });
  limit = validateLimit(limit);

  return repo.getTopItems(fromDate, toDate, limit);
}

function getSalesByType({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  return repo.getSalesByType(fromDate, toDate);
}

function getSalesByTable({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  return repo.getSalesByTable(fromDate, toDate);
}

function getSalesByOrderType({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  return repo.getSalesByOrderType(fromDate, toDate);
}

function getRecentCompletedOrders(limit) {
  limit = validateLimit(limit);

  return repo.getRecentCompletedOrders(limit);
}

module.exports = {
  getSummary,
  getTopItems,
  getSalesByType,
  getSalesByTable,
  getSalesByOrderType,
  getRecentCompletedOrders,
};
