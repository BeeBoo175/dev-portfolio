/*
 * The Gmail and Outlook marks, copied from Simple Icons (CC0 1.0), https://simpleicons.org, by way of
 * the @iconify-json/simple-icons package. The names and logos remain their owners' trademarks and are
 * used only to label links to those services. Drawn in one colour, like the GitHub mark beside them.
 */
function BrandIcon({ path, size }: { path: string; size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={path} />
        </svg>
    );
}

const GMAIL = "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64L12 9.548l6.545-4.91l1.528-1.145C21.69 2.28 24 3.434 24 5.457";
const OUTLOOK = "M7.88 12.04q0 .45-.11.87q-.1.41-.33.74q-.22.33-.58.52q-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55q-.22-.33-.33-.75q-.1-.42-.1-.86t.1-.87t.34-.76q.22-.34.59-.54q.36-.2.87-.2t.86.2q.35.21.57.55t.31.77q.1.43.1.88M24 12v9.38q0 .46-.33.8q-.33.32-.8.32H7.13q-.46 0-.8-.33q-.32-.33-.32-.8V18H1q-.41 0-.7-.3q-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75q.3-.3.75-.3h12.9q.44 0 .75.3q.3.3.3.75v8.3l1.24.72h.01q.1.07.18.18q.07.12.07.25m-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5l1.34-.8v-2.73zM9 3.75V6h2l.13.01l.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3q.7-.32 1.19-.86q.48-.55.73-1.28q.25-.74.25-1.61q0-.83-.25-1.55q-.24-.71-.71-1.24t-1.15-.83t-1.55-.3q-.92 0-1.64.3q-.71.3-1.2.85q-.5.54-.75 1.3q-.25.74-.25 1.63q0 .85.26 1.56q.26.72.74 1.23q.48.52 1.17.81q.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7q-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z";

// the Gmail mark is wide and short, so it needs a larger box to look as big as the others
export const GmailIcon = () => <BrandIcon path={GMAIL} size={18} />;
export const OutlookIcon = () => <BrandIcon path={OUTLOOK} size={16} />;
