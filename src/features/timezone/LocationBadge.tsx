/* flag from flag-icons (MIT); the build lists its notice with the others */
import malaysiaFlag from "flag-icons/flags/4x3/my.svg";
import "./LocationBadge.css";

export function LocationBadge() {
    return (
        <p className="location-badge pill pill--label">
            <img src={malaysiaFlag} alt="" width={24} height={18} />
            <span>
                Based in <strong>Malaysia</strong>
            </span>
        </p>
    );
}

export default LocationBadge;
