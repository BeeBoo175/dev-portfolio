/* Icons are from Lucide (ISC, partly Feather under MIT). The build writes their notices to third-party-licenses.md */
import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    ChevronDown,
    LoaderCircle,
    Minus,
    Pause,
    Play,
    Plus,
    Redo2,
    RefreshCw,
    Rocket,
    RotateCcw,
    SlidersHorizontal,
    TriangleAlert,
    Undo2,
    X,
    type LucideProps,
} from "lucide-react";
import { MarkGithubIcon } from "@primer/octicons-react";

const DEFAULTS = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;

export const ShipIcon = (props: LucideProps) => <Rocket {...DEFAULTS} {...props} />;
export const UndoIcon = (props: LucideProps) => <Undo2 {...DEFAULTS} {...props} />;
export const RedoIcon = (props: LucideProps) => <Redo2 {...DEFAULTS} {...props} />;
export const TuneIcon = (props: LucideProps) => <SlidersHorizontal {...DEFAULTS} {...props} />;
export const ResetIcon = (props: LucideProps) => <RotateCcw {...DEFAULTS} {...props} />;
export const CloseIcon = (props: LucideProps) => <X {...DEFAULTS} {...props} />;
export const PlusIcon = (props: LucideProps) => <Plus {...DEFAULTS} {...props} />;
export const MinusIcon = (props: LucideProps) => <Minus {...DEFAULTS} {...props} />;
export const BackIcon = (props: LucideProps) => <ArrowLeft {...DEFAULTS} {...props} />;
export const ForwardIcon = (props: LucideProps) => <ArrowRight {...DEFAULTS} {...props} />;
export const ExternalIcon = (props: LucideProps) => <ArrowUpRight {...DEFAULTS} {...props} />;
export const ExpandIcon = (props: LucideProps) => <ChevronDown {...DEFAULTS} {...props} />;
export const SpinnerIcon = (props: LucideProps) => <LoaderCircle {...DEFAULTS} {...props} />;
export const RefreshIcon = (props: LucideProps) => <RefreshCw {...DEFAULTS} {...props} />;
export const GithubIcon = () => <MarkGithubIcon size={15} />;
export const PauseIcon = (props: LucideProps) => <Pause {...DEFAULTS} {...props} />;
export const PlayIcon = (props: LucideProps) => <Play {...DEFAULTS} {...props} />;
export const AlertIcon = (props: LucideProps) => <TriangleAlert {...DEFAULTS} {...props} />;
export const UpIcon = (props: LucideProps) => <ArrowUp {...DEFAULTS} {...props} />;
