export const Utils = {
  formatJSON(data: unknown): string {
    if (!data) return "None";
    try {
      const obj = typeof data === "string" ? JSON.parse(data) : data;
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(data);
    }
  },

  getTime(): string {
    const now = new Date();
    const time = now.toLocaleTimeString(undefined, {
      hour12: false,
    } as Intl.DateTimeFormatOptions);
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    return `${time}.${milliseconds}`;
  },

  safeClone<T>(obj: T): T {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  },
};
