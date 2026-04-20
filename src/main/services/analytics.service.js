const repo = require('../db/repositories/analytics.repository');

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

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

function dateBounds({ fromDate, toDate }) {
  return {
    from: `${fromDate}T00:00:00.000Z`,
    to: `${toDate}T23:59:59.999Z`,
  };
}

function validatePagination({ page, pageSize }) {
  const parsedPage = page === undefined || page === null || page === '' ? 1 : Number(page);

  if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
    throw new Error('INVALID_PAGE');
  }

  const parsedPageSize =
    pageSize === undefined || pageSize === null || pageSize === ''
      ? DEFAULT_PAGE_SIZE
      : Number(pageSize);

  if (!Number.isInteger(parsedPageSize) || parsedPageSize <= 0 || parsedPageSize > MAX_PAGE_SIZE) {
    throw new Error('INVALID_PAGE_SIZE');
  }

  return {
    page: parsedPage,
    pageSize: parsedPageSize,
    offset: (parsedPage - 1) * parsedPageSize,
  };
}

function buildPage(items, total, page, pageSize) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return { items, total, page, pageSize, totalPages };
}

function getSummary({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  const { from, to } = dateBounds({ fromDate, toDate });

  return repo.getSummary(from, to);
}

function getTopItems({ fromDate, toDate, page, pageSize }) {
  validateDateRange({ fromDate, toDate });

  const pagination = validatePagination({ page, pageSize });
  const { from, to } = dateBounds({ fromDate, toDate });
  const items = repo.getTopItems(from, to, pagination.pageSize, pagination.offset);
  const total = repo.countTopItems(from, to);

  return buildPage(items, total, pagination.page, pagination.pageSize);
}

function getSalesByType({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  const { from, to } = dateBounds({ fromDate, toDate });

  return repo.getSalesByType(from, to);
}

function getSalesByOrderType({ fromDate, toDate }) {
  validateDateRange({ fromDate, toDate });

  const { from, to } = dateBounds({ fromDate, toDate });

  return repo.getSalesByOrderType(from, to);
}

function getSalesByTable({ fromDate, toDate, page, pageSize }) {
  validateDateRange({ fromDate, toDate });

  const pagination = validatePagination({ page, pageSize });
  const { from, to } = dateBounds({ fromDate, toDate });
  const items = repo.getSalesByTable(from, to, pagination.pageSize, pagination.offset);
  const total = repo.countSalesByTable(from, to);

  return buildPage(items, total, pagination.page, pagination.pageSize);
}

function getRecent({ fromDate, toDate, page, pageSize }) {
  validateDateRange({ fromDate, toDate });

  const pagination = validatePagination({ page, pageSize });
  const { from, to } = dateBounds({ fromDate, toDate });
  const items = repo.getRecentReadyOrders(from, to, pagination.pageSize, pagination.offset);
  const total = repo.countRecentReadyOrders(from, to);

  return buildPage(items, total, pagination.page, pagination.pageSize);
}

module.exports = {
  getSummary,
  getTopItems,
  getSalesByType,
  getSalesByOrderType,
  getSalesByTable,
  getRecent,
};
