/**
 * Format an ISO date string or timestamp into a human-readable format.
 * Example: "2026-06-03T14:30:00.000Z" -> "Jun 3, 2026, 2:30 PM"
 * Example: "2026-06-03" -> "Jun 3, 2026"
 */
export function formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        // If the string is just a date (YYYY-MM-DD), only return the date
        const isDateOnly = dateStr.length <= 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

        if (isDateOnly) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return dateStr;
    }
}

/**
 * Format a date string into a relative format like "2 hours ago" or "Yesterday".
 */
export function formatRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 172800) return 'Yesterday';
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}
