import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
    fallback: ReactNode;
    children: ReactNode;
    /** A change clears an earlier failure. Unlike a React key, it never remounts working children. */
    resetKey?: string;
    onError?: () => void;
}

/** Keeps a failure in one part (a lost download, a refused 3D context) from blanking the page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch() {
        this.props.onError?.();
    }

    componentDidUpdate(previous: ErrorBoundaryProps) {
        if (this.state.failed && previous.resetKey !== this.props.resetKey) {
            this.setState({ failed: false });
        }
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

export default ErrorBoundary;
