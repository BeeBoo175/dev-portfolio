import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BackIcon } from "../ui/Icons";
import "./ReadingScreen.css";

export interface ReadingScreenProps {
    title: string;
    backTo: string;
    backLabel: string;
    /** A badge shown beside the title. */
    icon?: ReactNode;
    children: ReactNode;
}

export function ReadingScreen({ title, backTo, backLabel, icon, children }: ReadingScreenProps) {
    const screenRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        document.documentElement.dataset.reading = "true";
        return () => {
            delete document.documentElement.dataset.reading;
        };
    }, []);

    // each new page starts at its top, with the title announced
    useEffect(() => {
        if (screenRef.current) screenRef.current.scrollTop = 0;
        titleRef.current?.focus({ preventScroll: true });
    }, [title]);

    return (
        <>
            <div className="reading-screen__scrim" aria-hidden="true" />
            <main ref={screenRef} className="reading-screen">
                <div className="reading-screen__bar">
                    <Link to={backTo} className="reading-screen__back pill">
                        <BackIcon /> {backLabel}
                    </Link>
                </div>
                <article key={title} className="reading-screen__page">
                    <div className="reading-screen__heading">
                        {icon}
                        <h1 ref={titleRef} className="reading-screen__title" tabIndex={-1}>
                            {title}
                        </h1>
                    </div>
                    {children}
                </article>
            </main>
        </>
    );
}

export default ReadingScreen;
