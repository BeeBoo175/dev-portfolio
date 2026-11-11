const SUBJECT = "Hello from your portfolio";

/**
 * Webmail ways to start an email. There is no "mailto:" link: it silently does nothing on a computer
 * with no mail app set up, and a page can't detect that.
 */
export function getComposeLinks(address: string) {
    const to = encodeURIComponent(address);
    const subject = encodeURIComponent(SUBJECT);
    return [
        { id: "gmail" as const, label: "Gmail", href: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}` },
        { id: "outlook" as const, label: "Outlook", href: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${subject}` },
    ];
}
