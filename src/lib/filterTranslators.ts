export function parseDateRange(filters: Record<string, any>) {
  let startDate: Date | undefined = undefined;
  let endDate: Date | undefined = undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filters.timeframe === 'today') {
    startDate = new Date(today);
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);
  } else if (filters.timeframe === 'week') {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
  } else if (filters.timeframe === 'month') {
    startDate = new Date(today);
    startDate.setDate(1);
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (filters.timeframe === 'custom' || (!filters.timeframe && (filters.date_start || filters.date_end))) {
    if (filters.date_start) {
      startDate = new Date(filters.date_start);
      startDate.setHours(0, 0, 0, 0);
    }
    if (filters.date_end) {
      endDate = new Date(filters.date_end);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  return { startDate, endDate };
}

export function taskFilterFromDashboardFilters(userId: string, filters: Record<string, any>) {
  const query: any = { userId };

  if (filters.priority && filters.priority !== 'Any') {
    query.priority = filters.priority;
  }

  const { startDate, endDate } = parseDateRange(filters);
  
  if (startDate || endDate) {
    const dueCondition: any = { $exists: true };
    const createdCondition: any = {};
    if (startDate) {
      dueCondition.$gte = startDate;
      createdCondition.$gte = startDate;
    }
    if (endDate) {
      dueCondition.$lt = endDate;
      createdCondition.$lt = endDate;
    }
    
    query.$or = [
      { dueDate: dueCondition },
      { dueDate: { $exists: false }, createdAt: createdCondition }
    ];
  }

  return query;
}

export function ideaFilterFromDashboardFilters(userId: string, filters: Record<string, any>) {
  const query: any = { userId };
  
  const { startDate, endDate } = parseDateRange(filters);
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lt = endDate;
  }

  return query;
}

export function financeFilterFromDashboardFilters(userId: string, filters: Record<string, any>) {
  const query: any = { userId };
  
  const { startDate, endDate } = parseDateRange(filters);
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lt = endDate;
  }

  return query;
}
