const XLSX = require('xlsx');
const analyticsRepo = require('../db/repositories/analytics.repository');

const EXPORT_ROW_LIMIT = 100000;

function dateBounds({ fromDate, toDate }) {
  if (typeof fromDate !== 'string' || fromDate.trim().length === 0 || Number.isNaN(Date.parse(fromDate))) {
    throw new Error('INVALID_FROM_DATE');
  }

  if (typeof toDate !== 'string' || toDate.trim().length === 0 || Number.isNaN(Date.parse(toDate))) {
    throw new Error('INVALID_TO_DATE');
  }

  if (Date.parse(fromDate) > Date.parse(toDate)) {
    throw new Error('INVALID_DATE_RANGE');
  }

  return {
    from: `${fromDate}T00:00:00.000Z`,
    to: `${toDate}T23:59:59.999Z`,
  };
}

function orderTypeLabel(orderType) {
  return orderType === 'DINE_IN' ? 'Zalda' : 'Olib ketish';
}

function itemTypeLabel(type) {
  return type === 'FOOD' ? 'Taom' : 'Combo';
}

function appendSheet(wb, rows, sheetName) {
  const sheet = rows.length > 0
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([['Ma’lumot topilmadi']]);

  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
}

function buildWorkbook({ fromDate, toDate }) {
  const { from, to } = dateBounds({ fromDate, toDate });

  const summary = analyticsRepo.getSummary(from, to);
  const topItems = analyticsRepo.getTopItems(from, to, EXPORT_ROW_LIMIT, 0);
  const salesByType = analyticsRepo.getSalesByType(from, to);
  const salesByOrderType = analyticsRepo.getSalesByOrderType(from, to);
  const salesByTable = analyticsRepo.getSalesByTable(from, to, EXPORT_ROW_LIMIT, 0);
  const recentOrders = analyticsRepo.getRecentReadyOrders(from, to, EXPORT_ROW_LIMIT, 0);

  const wb = XLSX.utils.book_new();

  appendSheet(
    wb,
    [
      { 'Ko‘rsatkich': 'Boshlanish sanasi', 'Qiymat': fromDate },
      { 'Ko‘rsatkich': 'Tugash sanasi', 'Qiymat': toDate },
      { 'Ko‘rsatkich': 'Jami savdo', 'Qiymat': Number(summary.total_sales || 0) },
      { 'Ko‘rsatkich': 'Buyurtmalar soni', 'Qiymat': Number(summary.completed_orders_count || 0) },
      { 'Ko‘rsatkich': 'Sotilgan mahsulotlar soni', 'Qiymat': Number(summary.total_items_sold || 0) },
    ],
    'Umumiy'
  );

  appendSheet(
    wb,
    topItems.map((row) => ({
      'Mahsulot nomi': row.item_name,
      'Turi': itemTypeLabel(row.type),
      'Sotilgan soni': Number(row.total_quantity || 0),
      'Jami savdo': Number(row.total_sales || 0),
    })),
    'Top mahsulotlar'
  );

  appendSheet(
    wb,
    salesByType.map((row) => ({
      'Turi': itemTypeLabel(row.type),
      'Sotilgan soni': Number(row.total_quantity || 0),
      'Jami savdo': Number(row.total_sales || 0),
    })),
    'Mahsulot turi'
  );

  appendSheet(
    wb,
    salesByOrderType.map((row) => ({
      'Buyurtma turi': orderTypeLabel(row.order_type),
      'Buyurtmalar soni': Number(row.orders_count || 0),
      'Jami savdo': Number(row.total_sales || 0),
    })),
    'Buyurtma turi'
  );

  appendSheet(
    wb,
    salesByTable.map((row) => ({
      'Stol raqami': row.table_number ?? '',
      'Buyurtmalar soni': Number(row.completed_orders_count || 0),
      'Jami savdo': Number(row.total_sales || 0),
    })),
    'Stollar'
  );

  appendSheet(
    wb,
    recentOrders.map((row) => ({
      'ID': row.id,
      'Stol raqami': row.table_number ?? '',
      'Buyurtma turi': orderTypeLabel(row.order_type),
      'Jami': Number(row.total_price || 0),
      'Yopilgan vaqti': row.closed_at || '',
    })),
    'So‘nggi tayyor buyurtmalar'
  );

  return wb;
}

function writeWorkbookToFile(wb, filePath) {
  XLSX.writeFile(wb, filePath);
}

module.exports = {
  buildWorkbook,
  writeWorkbookToFile,
};
