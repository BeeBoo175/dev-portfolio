import { describe, expect, it } from "vitest";
import { getComposeLinks } from "./composeLinks";

describe("getComposeLinks", () => {
    const links = Object.fromEntries(getComposeLinks("me+jobs@example.com").map((link) => [link.label, link.href]));

    it("fills in the address and subject for each webmail", () => {
        const gmail = new URL(links.Gmail);
        expect(gmail.searchParams.get("to")).toBe("me+jobs@example.com");
        expect(gmail.searchParams.get("su")).toBe("Hello from your portfolio");
        const outlook = new URL(links.Outlook);
        expect(outlook.searchParams.get("to")).toBe("me+jobs@example.com");
        expect(outlook.searchParams.get("subject")).toBe("Hello from your portfolio");
    });
});
