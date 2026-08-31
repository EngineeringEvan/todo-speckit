const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DUE_DATE_ERROR = "Due date must be a valid date in YYYY-MM-DD format.";

export function isValidDueDateString(value) {
  if (!DATE_ONLY_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function normalizeDueDateInput(value) {
  if (value === undefined) {
    return { omitted: true };
  }

  if (value === null || value === "") {
    return { value: null };
  }

  if (typeof value !== "string" || !isValidDueDateString(value)) {
    return { error: DUE_DATE_ERROR };
  }

  return { value };
}
