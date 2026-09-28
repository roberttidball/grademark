import * as https from "https";

interface FxMacroDataCalendarResponse {
    data: FxMacroDataEvent[];
}

interface FxMacroDataEvent {
    name?: string;
    date?: string;
    announcement_datetime_utc?: string;
    market_tier?: number;
    top_tier_for_currency?: boolean;
}

export async function fetchFxMacroDataCalendar(
    currency: string,
    startDate: string,
    endDate: string
): Promise<FxMacroDataEvent[]> {
    const url = `https://api.fxmacrodata.com/v1/calendar/${currency}?start_date=${startDate}&end_date=${endDate}`;
    const payload = await getJson<FxMacroDataCalendarResponse>(url);
    return payload.data || [];
}

export function topTierBlackoutDates(events: FxMacroDataEvent[]): string[] {
    const dates = events
        .filter(event => event.top_tier_for_currency || event.market_tier === 1)
        .map(event => (event.announcement_datetime_utc || event.date || "").slice(0, 10))
        .filter(date => date.length > 0);
    return Array.from(new Set(dates)).sort();
}

function getJson<T>(url: string): Promise<T> {
    const apiKey = process.env.FXMACRODATA_API_KEY;
    const headers: https.RequestOptions["headers"] = apiKey ? { "X-API-Key": apiKey } : {};
    return new Promise<T>((resolve, reject) => {
        https.get(url, { headers }, response => {
            let data = "";
            response.on("data", chunk => {
                data += chunk;
            });
            response.on("end", () => {
                try {
                    resolve(JSON.parse(data) as T);
                }
                catch (error) {
                    reject(error);
                }
            });
        }).on("error", reject);
    });
}

if (require.main === module) {
    fetchFxMacroDataCalendar("USD", "2026-07-01", "2026-07-20")
        .then(events => console.log(topTierBlackoutDates(events)))
        .catch(error => {
            console.error(error);
            process.exitCode = 1;
        });
}
